#!/usr/bin/env python3
"""
KIPRIS 데이터 필터링 및 이미지 복사 스크립트
Type D 제외, 중복 제외 후 이미지만 외장하드에 복사
나중에 GPU 서버에서 임베딩 처리용
"""

import os
import sys
import json
import shutil
from pathlib import Path
from typing import List, Dict, Any, Set
from collections import defaultdict
from tqdm import tqdm

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
except ImportError:
    print("❌ Error: psycopg2 not installed")
    print("Run: pip install psycopg2-binary")
    sys.exit(1)


class KIPRISImageFilter:
    """KIPRIS 이미지 필터링 및 복사 클래스"""

    # 순수 텍스트 타입 필터링 (도형이 없는 것들)
    TYPE_D_KEYWORDS = ['한글상표', '영문상표', '복합문자', '한자상표', '일어상표']

    # TB_KT10 필드 인덱스
    KT10_FIELDS = {
        'trademark_number': 0,
        'application_date': 1,
        'trademark_name': 6,
        'status': 9,
        'trademark_type': 12,
        'trademark_composition': 14,
    }

    def __init__(
        self,
        source_path: str = "/Volumes/T9/KIPRIS_BULK_zip",
        output_path: str = "/Volumes/T9/KIPRIS_FILTERED"
    ):
        self.source_path = Path(source_path)
        self.output_path = Path(output_path)
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

        # Statistics
        self.stats = {
            'total_parsed': 0,
            'duplicates_skipped': 0,
            'type_d_filtered': 0,
            'no_image_skipped': 0,
            'images_copied': 0
        }

        # Create output directory
        self.output_path.mkdir(parents=True, exist_ok=True)

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
        """TB_KT15.txt 파일 파싱"""
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
        """이미지 디렉토리 스캔하여 상표번호 -> 파일경로 맵 생성"""
        print(f"  🗂️  Building image map for {img_dir}...")
        image_map = {}

        for ext in ['*.jpg', '*.png']:
            for img_file in img_dir.glob(ext):
                filename = img_file.stem
                import re
                match = re.search(r'([47]\d{12,})', filename)
                if match:
                    tm_num = match.group(1)
                    if tm_num not in image_map:
                        image_map[tm_num] = img_file

        print(f"  ✅ Built image map: {len(image_map):,} images indexed")
        return image_map

    def process_week_data(self, week: str, existing_numbers: Set[str]) -> Dict[str, Any]:
        """특정 주차 데이터 필터링 및 복사"""
        week_path = self.source_path / week
        output_week_path = self.output_path / week
        output_img_dir = output_week_path / 'images'

        print(f"\n📅 Processing {week}...")

        # Create output directories
        output_week_path.mkdir(parents=True, exist_ok=True)
        output_img_dir.mkdir(parents=True, exist_ok=True)

        # Parse KT10 and KT15
        kt10_file = week_path / 'TB_KT10.txt'
        kt15_file = week_path / 'TB_KT15.txt'
        img_dir = week_path / 'IMG'

        if not kt10_file.exists() or not kt15_file.exists():
            print(f"⚠️ Missing files in {week}, skipping...")
            return {}

        print(f"  📂 Parsing TB_KT10.txt...")
        trademarks = self.parse_kt10_file(kt10_file)
        print(f"  ✅ Parsed {len(trademarks):,} trademarks")

        print(f"  📂 Parsing TB_KT15.txt...")
        classifications = self.parse_kt15_file(kt15_file)
        print(f"  ✅ Parsed classifications for {len(classifications):,} trademarks")

        # Build image map
        image_map = self.build_image_map(img_dir)

        # Process and filter
        metadata = []
        for tm in tqdm(trademarks, desc=f"  Filtering {week}"):
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

            # 3. Check image exists
            if tm_num not in image_map:
                self.stats['no_image_skipped'] += 1
                continue

            # 4. Copy image
            source_img = image_map[tm_num]
            dest_img = output_img_dir / source_img.name

            try:
                shutil.copy2(source_img, dest_img)
                self.stats['images_copied'] += 1

                # 5. Store metadata
                tm_classes = classifications.get(tm_num, [])
                metadata.append({
                    'trademark_number': tm_num,
                    'application_date': tm['application_date'],
                    'trademark_name': tm['trademark_name'],
                    'status': tm['status'],
                    'trademark_type': tm['trademark_type'],
                    'trademark_composition': tm['trademark_composition'],
                    'classifications': tm_classes,
                    'image_filename': source_img.name
                })

                # Add to existing set
                existing_numbers.add(tm_num)

            except Exception as e:
                print(f"⚠️ Failed to copy {source_img}: {e}")
                continue

        # Save metadata
        metadata_file = output_week_path / 'metadata.json'
        with open(metadata_file, 'w', encoding='utf-8') as f:
            json.dump(metadata, f, ensure_ascii=False, indent=2)

        print(f"  ✅ Copied {len(metadata):,} images from {week}")
        return metadata

    def run(self):
        """메인 실행 함수"""
        print("=" * 60)
        print("🚀 KIPRIS 이미지 필터링 및 복사 시작")
        print("=" * 60)
        print(f"📂 Source: {self.source_path}")
        print(f"📂 Output: {self.output_path}")

        # 1. Fetch existing trademarks
        existing_numbers = self.fetch_existing_trademark_numbers()

        # 2. Process each week
        for week in self.weeks:
            self.process_week_data(week, existing_numbers)

        # 3. Print statistics
        print("\n" + "=" * 60)
        print("📊 처리 완료 통계")
        print("=" * 60)
        print(f"  총 파싱: {self.stats['total_parsed']:,}개")
        print(f"  중복 제외: {self.stats['duplicates_skipped']:,}개")
        print(f"  Type D 필터: {self.stats['type_d_filtered']:,}개")
        print(f"  이미지 없음: {self.stats['no_image_skipped']:,}개")
        print(f"  이미지 복사 완료: {self.stats['images_copied']:,}개")
        print("\n✅ 필터링 완료! GPU 서버에서 임베딩 처리 가능")
        print(f"📁 복사된 파일 위치: {self.output_path}")
        print("=" * 60)


def main():
    processor = KIPRISImageFilter()
    processor.run()


if __name__ == "__main__":
    main()
