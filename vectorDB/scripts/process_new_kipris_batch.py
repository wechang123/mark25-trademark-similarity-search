#!/usr/bin/env python3
"""
외장하드 신규 KIPRIS 데이터 일괄 처리 스크립트
4개 주차 데이터 (20251018~20251108)를 처리하여 trademark_embeddings_filtered에 업로드
"""

import os
import sys
import json
import time
import io
import csv
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
from collections import defaultdict
import numpy as np
from tqdm import tqdm
from PIL import Image

# Environment variable loader
def load_env_file(env_path: Path) -> None:
    """Load environment variables from .env.local file"""
    if not env_path.exists():
        print(f"❌ Environment file not found: {env_path}")
        return

    with open(env_path, 'r') as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                key, value = line.split('=', 1)
                value = value.strip().strip('"').strip("'")
                os.environ[key] = value

# Load environment variables
project_root = Path(__file__).parent.parent.parent
load_env_file(project_root / '.env.local')
load_env_file(project_root / 'vectorDB' / '.env.local')

try:
    import psycopg2
    from psycopg2 import sql
except ImportError:
    print("❌ Error: psycopg2 not installed")
    print("Run: pip install psycopg2-binary")
    sys.exit(1)

try:
    import torch
    from transformers import AutoImageProcessor, AutoModel
except ImportError:
    print("❌ Error: transformers or torch not installed")
    print("Run: pip install transformers torch pillow")
    sys.exit(1)


class KIPRISDataProcessor:
    """KIPRIS 신규 데이터 처리 클래스"""

    # Type D 필터링 키워드 (create_filtered_embeddings.py 참고)
    TYPE_D_KEYWORDS = ['Type D - 순수 텍스트', '순수 텍스트']

    # TB_KT10 필드 인덱스 (^B 구분자 기준)
    KT10_FIELDS = {
        'trademark_number': 0,      # 출원번호
        'application_date': 1,       # 출원일자
        'trademark_name': 2,         # 상표명
        'status': 3,                 # 상태
        'trademark_type': 4,         # 상표유형
        'trademark_composition': 5,  # 상표구성 ⭐ Type D 필터링용
    }

    def __init__(self, external_drive_path: str = "/Volumes/T9/KIPRIS_BULK_zip"):
        self.external_drive = Path(external_drive_path)
        self.weeks = ['20251018', '20251025', '20251101', '20251108']

        # Supabase connection
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        self.db_password = os.getenv('POSTGRES_PASSWORD')

        if not self.supabase_url or not self.service_key:
            raise ValueError("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

        password = self.db_password if self.db_password else self.service_key
        project_id = self.supabase_url.replace('https://', '').replace('.supabase.co', '')

        self.conn_string = (
            f"postgres://postgres.{project_id}:{password}"
            f"@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
            f"?sslmode=require"
        )

        # DINOv2 model initialization
        print("🤖 Loading DINOv2 model...")
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = AutoImageProcessor.from_pretrained('facebook/dinov2-large')
        self.model = AutoModel.from_pretrained('facebook/dinov2-large').to(self.device)
        self.model.eval()
        print(f"✅ Model loaded on {self.device}")

        # Statistics
        self.stats = {
            'total_parsed': 0,
            'duplicates_skipped': 0,
            'type_d_filtered': 0,
            'no_image_skipped': 0,
            'uploaded': 0
        }

    def fetch_existing_trademark_numbers(self) -> Set[str]:
        """Supabase에서 기존 trademark_number 조회"""
        print("📊 Fetching existing trademark numbers from Supabase...")

        conn = psycopg2.connect(self.conn_string)
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT DISTINCT trademark_number FROM trademark_embeddings_filtered")
                existing = {row[0] for row in cur.fetchall()}
                print(f"✅ Found {len(existing):,} existing trademarks")
                return existing
        finally:
            conn.close()

    def parse_kt10_file(self, filepath: Path) -> List[Dict[str, Any]]:
        """TB_KT10.txt 파일 파싱"""
        trademarks = []

        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.strip().split('^B')
                if len(parts) < 6:
                    continue

                trademark = {
                    'trademark_number': parts[self.KT10_FIELDS['trademark_number']],
                    'application_date': parts[self.KT10_FIELDS['application_date']],
                    'trademark_name': parts[self.KT10_FIELDS['trademark_name']],
                    'status': parts[self.KT10_FIELDS['status']],
                    'trademark_type': parts[self.KT10_FIELDS['trademark_type']],
                    'trademark_composition': parts[self.KT10_FIELDS['trademark_composition']],
                }
                trademarks.append(trademark)

        return trademarks

    def parse_kt15_file(self, filepath: Path) -> Dict[str, List[Dict[str, str]]]:
        """TB_KT15.txt 파일 파싱 및 출원번호별 그룹핑"""
        classifications = defaultdict(list)

        with open(filepath, 'r', encoding='utf-8') as f:
            for line in f:
                parts = line.strip().split('^B')
                if len(parts) < 5:
                    continue

                trademark_number = parts[0]
                classification = {
                    'sequence': parts[1],
                    'class_code': parts[2],
                    'product_name': parts[3],
                    'product_code': parts[4] if len(parts) > 4 else ''
                }
                classifications[trademark_number].append(classification)

        return dict(classifications)

    def is_type_d(self, trademark_composition: str) -> bool:
        """Type D (순수 텍스트) 여부 판단"""
        for keyword in self.TYPE_D_KEYWORDS:
            if keyword in trademark_composition:
                return True
        return False

    def build_image_map(self, img_dir: Path) -> Dict[str, Path]:
        """이미지 디렉토리의 모든 파일을 스캔하여 상표번호 -> 파일경로 맵 생성"""
        print(f"  🗂️  Building image map for {img_dir}...")
        image_map = {}

        for ext in ['*.jpg', '*.png']:
            for img_file in img_dir.glob(ext):
                # Extract trademark number from filename
                # Format: XXX상표번호XXX.jpg
                filename = img_file.stem
                # Try to extract trademark number (보통 파일명에 포함)
                import re
                match = re.search(r'([47]\d{12,})', filename)
                if match:
                    tm_num = match.group(1)
                    if tm_num not in image_map:
                        image_map[tm_num] = img_file

        print(f"  ✅ Built image map: {len(image_map):,} images indexed")
        return image_map

    def generate_embedding(self, image_path: Path) -> Optional[np.ndarray]:
        """이미지에서 DINOv2 임베딩 생성"""
        try:
            image = Image.open(image_path).convert('RGB')
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)

            with torch.no_grad():
                outputs = self.model(**inputs)
                # CLS token embedding
                embedding = outputs.last_hidden_state[:, 0].cpu().numpy().flatten()

            return embedding
        except Exception as e:
            print(f"⚠️ Embedding generation failed for {image_path}: {e}")
            return None

    def process_week_data(self, week: str, existing_numbers: Set[str]) -> List[Dict[str, Any]]:
        """특정 주차 데이터 처리"""
        week_path = self.external_drive / week
        print(f"\n📅 Processing {week}...")

        # Parse KT10 and KT15
        kt10_file = week_path / 'TB_KT10.txt'
        kt15_file = week_path / 'TB_KT15.txt'
        img_dir = week_path / 'IMG'

        if not kt10_file.exists() or not kt15_file.exists():
            print(f"⚠️ Missing files in {week}, skipping...")
            return []

        print(f"  📂 Parsing TB_KT10.txt...")
        trademarks = self.parse_kt10_file(kt10_file)
        print(f"  ✅ Parsed {len(trademarks):,} trademarks")

        print(f"  📂 Parsing TB_KT15.txt...")
        classifications = self.parse_kt15_file(kt15_file)
        print(f"  ✅ Parsed classifications for {len(classifications):,} trademarks")

        # ⚡ Build image map (RAM에 이미지 목록 로드)
        image_map = self.build_image_map(img_dir)

        # Process each trademark
        processed = []
        for tm in tqdm(trademarks, desc=f"  Processing {week}"):
            tm_num = tm['trademark_number']
            self.stats['total_parsed'] += 1

            # 1. Check duplicate
            if tm_num in existing_numbers:
                self.stats['duplicates_skipped'] += 1
                continue

            # 2. Filter Type D
            if self.is_type_d(tm['trademark_composition']):
                self.stats['type_d_filtered'] += 1
                continue

            # 3. Find image file (⚡ RAM에서 즉시 찾기)
            if tm_num not in image_map:
                self.stats['no_image_skipped'] += 1
                continue

            image_path = image_map[tm_num]

            # 4. Generate embedding
            embedding = self.generate_embedding(image_path)
            if embedding is None:
                self.stats['no_image_skipped'] += 1
                continue

            # 5. Prepare data
            tm_classes = classifications.get(tm_num, [])
            processed.append({
                'trademark_number': tm_num,
                'embedding': embedding,
                'metadata': {
                    'application_date': tm['application_date'],
                    'trademark_name': tm['trademark_name'],
                    'status': tm['status'],
                    'trademark_type': tm['trademark_type'],
                    'trademark_composition': tm['trademark_composition'],
                    'classifications': tm_classes
                }
            })

            # Add to existing set to avoid duplicates within batch
            existing_numbers.add(tm_num)

        print(f"  ✅ Processed {len(processed):,} trademarks from {week}")
        return processed

    def upload_to_supabase(self, trademarks: List[Dict[str, Any]], batch_size: int = 1000):
        """Supabase에 배치 업로드 (PostgreSQL COPY 방식)"""
        if not trademarks:
            print("⚠️ No data to upload")
            return

        print(f"\n📤 Uploading {len(trademarks):,} trademarks to Supabase...")

        conn = psycopg2.connect(self.conn_string)
        try:
            with conn.cursor() as cur:
                # Prepare CSV data
                csv_data = io.StringIO()
                writer = csv.writer(csv_data)

                for tm in tqdm(trademarks, desc="Preparing upload"):
                    # Format: trademark_number, embedding (vector string), created_at
                    embedding_str = '[' + ','.join(map(str, tm['embedding'])) + ']'
                    writer.writerow([
                        tm['trademark_number'],
                        embedding_str,
                        'now()'
                    ])

                csv_data.seek(0)

                # COPY command
                copy_sql = """
                    COPY trademark_embeddings_filtered (trademark_number, embedding, created_at)
                    FROM STDIN WITH (FORMAT CSV)
                """

                cur.copy_expert(copy_sql, csv_data)
                conn.commit()

                self.stats['uploaded'] = len(trademarks)
                print(f"✅ Upload complete: {len(trademarks):,} records")

        except Exception as e:
            conn.rollback()
            print(f"❌ Upload failed: {e}")
            raise
        finally:
            conn.close()

    def run(self):
        """메인 실행 함수"""
        print("=" * 60)
        print("🚀 KIPRIS 신규 데이터 처리 시작")
        print("=" * 60)

        start_time = time.time()

        # 1. Fetch existing trademarks
        existing_numbers = self.fetch_existing_trademark_numbers()

        # 2. Process each week
        all_processed = []
        for week in self.weeks:
            week_data = self.process_week_data(week, existing_numbers)
            all_processed.extend(week_data)

        # 3. Upload to Supabase
        if all_processed:
            self.upload_to_supabase(all_processed)

        # 4. Print statistics
        elapsed = time.time() - start_time
        print("\n" + "=" * 60)
        print("📊 처리 완료 통계")
        print("=" * 60)
        print(f"  총 파싱: {self.stats['total_parsed']:,}개")
        print(f"  중복 제외: {self.stats['duplicates_skipped']:,}개")
        print(f"  Type D 필터: {self.stats['type_d_filtered']:,}개")
        print(f"  이미지 없음: {self.stats['no_image_skipped']:,}개")
        print(f"  업로드 성공: {self.stats['uploaded']:,}개")
        print(f"\n  소요 시간: {elapsed/60:.1f}분")
        print("=" * 60)


def main():
    processor = KIPRISDataProcessor()
    processor.run()


if __name__ == "__main__":
    main()
