#!/usr/bin/env python3
"""
AI 도형상표 이미지 검색 학습데이터 처리 스크립트
138만개 이미지를 처리하여 trademark_embeddings_filtered에 업로드
- 기존 DB 출원번호와 중복 제외
- DINOv2 임베딩 생성
- 배치 업로드
"""

import os
import sys
import re
import io
import csv
import time
import tarfile
import zipfile
import tempfile
from pathlib import Path
from typing import Set, List, Dict, Any, Optional
import numpy as np
from tqdm import tqdm
from PIL import Image

# Environment variable loader
def load_env_file(env_path: Path) -> None:
    """Load environment variables from .env.local file"""
    if not env_path.exists():
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


class AITrademarkDatasetProcessor:
    """AI 도형상표 학습데이터 처리 클래스"""

    def __init__(self, data_path: str = "/Volumes/T9"):
        self.data_path = Path(data_path)
        self.tar_files = sorted(self.data_path.glob("AI_Trademark_Img_*.tar"))

        if not self.tar_files:
            raise FileNotFoundError(f"No tar files found in {data_path}")

        print(f"📦 Found {len(self.tar_files)} tar files:")
        for tf in self.tar_files:
            size_gb = tf.stat().st_size / (1024**3)
            print(f"   - {tf.name} ({size_gb:.1f}GB)")

        # Supabase connection
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.db_password = os.getenv('POSTGRES_PASSWORD')
        self.service_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

        if not self.supabase_url:
            raise ValueError("Missing NEXT_PUBLIC_SUPABASE_URL")

        password = self.db_password if self.db_password else self.service_key
        project_id = self.supabase_url.replace('https://', '').replace('.supabase.co', '')

        self.conn_string = (
            f"postgres://postgres.{project_id}:{password}"
            f"@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
            f"?sslmode=require"
        )

        # DINOv2 model initialization
        print("\n🤖 Loading DINOv2 model...")
        if torch.cuda.is_available():
            self.device = "cuda"
        elif torch.backends.mps.is_available():
            self.device = "mps"
        else:
            self.device = "cpu"

        self.processor = AutoImageProcessor.from_pretrained('facebook/dinov2-large')
        self.model = AutoModel.from_pretrained('facebook/dinov2-large').to(self.device)
        self.model.eval()
        print(f"✅ Model loaded on {self.device}")

        # Statistics
        self.stats = {
            'total_images': 0,
            'duplicates_skipped': 0,
            'processed': 0,
            'errors': 0,
            'uploaded': 0
        }

    def fetch_existing_trademark_numbers(self) -> Set[str]:
        """Supabase에서 기존 trademark_number 조회"""
        print("\n📊 Fetching existing trademark numbers from Supabase...")

        conn = psycopg2.connect(self.conn_string)
        try:
            with conn.cursor() as cur:
                cur.execute("SELECT DISTINCT trademark_number FROM trademark_embeddings_filtered")
                existing = {row[0] for row in cur.fetchall()}
                print(f"✅ Found {len(existing):,} existing trademarks in DB")
                return existing
        finally:
            conn.close()

    def extract_trademark_number(self, filename: str) -> Optional[str]:
        """파일명에서 출원번호 추출"""
        # 패턴: 4020200183780_tm000001.jpg 또는 4020160002656.jpg
        match = re.search(r'([47]\d{12,})', filename)
        if match:
            return match.group(1)
        return None

    def generate_embedding(self, image_data: bytes) -> Optional[np.ndarray]:
        """이미지 데이터에서 DINOv2 임베딩 생성"""
        try:
            image = Image.open(io.BytesIO(image_data)).convert('RGB')
            inputs = self.processor(images=image, return_tensors="pt").to(self.device)

            with torch.no_grad():
                outputs = self.model(**inputs)
                embedding = outputs.last_hidden_state[:, 0].cpu().numpy().flatten()

            return embedding
        except Exception as e:
            return None

    def upload_batch(self, batch: List[Dict[str, Any]]) -> int:
        """배치 업로드 (PostgreSQL COPY 방식)"""
        if not batch:
            return 0

        conn = psycopg2.connect(self.conn_string)
        try:
            with conn.cursor() as cur:
                csv_data = io.StringIO()
                writer = csv.writer(csv_data)

                for item in batch:
                    embedding_str = '[' + ','.join(map(str, item['embedding'])) + ']'
                    writer.writerow([item['trademark_number'], embedding_str, 'now()'])

                csv_data.seek(0)

                copy_sql = """
                    COPY trademark_embeddings_filtered (trademark_number, embedding, created_at)
                    FROM STDIN WITH (FORMAT CSV)
                """
                cur.copy_expert(copy_sql, csv_data)
                conn.commit()
                return len(batch)
        except Exception as e:
            conn.rollback()
            print(f"❌ Upload error: {e}")
            return 0
        finally:
            conn.close()

    def process_zip_in_memory(self, tar: tarfile.TarFile, zip_name: str,
                              existing_numbers: Set[str], batch: List[Dict]) -> int:
        """tar 내 zip 파일을 메모리에서 처리"""
        processed = 0

        try:
            zip_member = tar.getmember(zip_name)
            zip_file = tar.extractfile(zip_member)

            if zip_file is None:
                return 0

            with zipfile.ZipFile(io.BytesIO(zip_file.read())) as zf:
                image_files = [f for f in zf.namelist()
                              if f.lower().endswith(('.jpg', '.jpeg', '.png'))
                              and not f.startswith('__MACOSX')]

                for img_name in image_files:
                    self.stats['total_images'] += 1

                    # Extract trademark number
                    tm_num = self.extract_trademark_number(img_name)
                    if not tm_num:
                        continue

                    # Skip duplicates
                    if tm_num in existing_numbers:
                        self.stats['duplicates_skipped'] += 1
                        continue

                    # Read image and generate embedding
                    try:
                        img_data = zf.read(img_name)
                        embedding = self.generate_embedding(img_data)

                        if embedding is not None:
                            batch.append({
                                'trademark_number': tm_num,
                                'embedding': embedding
                            })
                            existing_numbers.add(tm_num)  # Prevent duplicates within batch
                            processed += 1
                            self.stats['processed'] += 1
                        else:
                            self.stats['errors'] += 1
                    except Exception as e:
                        self.stats['errors'] += 1

        except Exception as e:
            print(f"⚠️ Error processing {zip_name}: {e}")

        return processed

    def process_tar_file(self, tar_path: Path, existing_numbers: Set[str],
                        batch_size: int = 500) -> int:
        """단일 tar 파일 처리"""
        print(f"\n📦 Processing {tar_path.name}...")
        total_uploaded = 0
        batch = []

        with tarfile.open(tar_path, 'r') as tar:
            zip_names = [m.name for m in tar.getmembers() if m.name.endswith('.zip')]
            print(f"   Found {len(zip_names)} zip files")

            for zip_name in tqdm(zip_names, desc=f"   {tar_path.name}"):
                self.process_zip_in_memory(tar, zip_name, existing_numbers, batch)

                # Upload when batch is full
                if len(batch) >= batch_size:
                    uploaded = self.upload_batch(batch)
                    total_uploaded += uploaded
                    self.stats['uploaded'] += uploaded
                    batch = []
                    print(f"   ✅ Uploaded batch: {uploaded} (Total: {self.stats['uploaded']:,})")

        # Upload remaining
        if batch:
            uploaded = self.upload_batch(batch)
            total_uploaded += uploaded
            self.stats['uploaded'] += uploaded
            print(f"   ✅ Uploaded final batch: {uploaded}")

        return total_uploaded

    def run(self, start_from: int = 0):
        """메인 실행 함수"""
        print("=" * 60)
        print("🚀 AI 도형상표 학습데이터 처리 시작")
        print("=" * 60)

        start_time = time.time()

        # 1. Fetch existing trademarks
        existing_numbers = self.fetch_existing_trademark_numbers()

        # 2. Process each tar file
        for i, tar_path in enumerate(self.tar_files):
            if i < start_from:
                print(f"\n⏭️ Skipping {tar_path.name} (start_from={start_from})")
                continue

            self.process_tar_file(tar_path, existing_numbers)

            # Print intermediate stats
            elapsed = time.time() - start_time
            print(f"\n📊 Progress after {tar_path.name}:")
            print(f"   Total images: {self.stats['total_images']:,}")
            print(f"   Duplicates skipped: {self.stats['duplicates_skipped']:,}")
            print(f"   Processed: {self.stats['processed']:,}")
            print(f"   Uploaded: {self.stats['uploaded']:,}")
            print(f"   Errors: {self.stats['errors']:,}")
            print(f"   Elapsed: {elapsed/60:.1f}min")

        # 3. Final statistics
        elapsed = time.time() - start_time
        print("\n" + "=" * 60)
        print("📊 처리 완료 통계")
        print("=" * 60)
        print(f"  총 이미지: {self.stats['total_images']:,}개")
        print(f"  중복 제외: {self.stats['duplicates_skipped']:,}개")
        print(f"  처리 완료: {self.stats['processed']:,}개")
        print(f"  업로드 성공: {self.stats['uploaded']:,}개")
        print(f"  에러: {self.stats['errors']:,}개")
        print(f"\n  소요 시간: {elapsed/60:.1f}분 ({elapsed/3600:.1f}시간)")
        print("=" * 60)


def main():
    import argparse
    parser = argparse.ArgumentParser(description='Process AI Trademark Dataset')
    parser.add_argument('--data-path', default='/Volumes/T9', help='Path to external drive')
    parser.add_argument('--start-from', type=int, default=0, help='Start from tar file index (0-4)')
    args = parser.parse_args()

    processor = AITrademarkDatasetProcessor(data_path=args.data_path)
    processor.run(start_from=args.start_from)


if __name__ == "__main__":
    main()
