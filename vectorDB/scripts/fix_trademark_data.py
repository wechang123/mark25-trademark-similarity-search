#!/usr/bin/env python3
"""
마이그레이션 완료 후 데이터 정리 스크립트
- Windows 경로에서 순수 상표번호 추출
- filename, filepath 수정
- 메타데이터 매칭 및 업데이트
"""
import os
import sys
import json
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Load environment
env_path = Path(__file__).resolve().parents[2] / '.env.local'
load_dotenv(env_path)

class TrademarkDataFixer:
    def __init__(self):
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.db_password = os.getenv('POSTGRES_PASSWORD')

        if not self.supabase_url or not self.db_password:
            raise ValueError("Missing required environment variables")

        # Extract project ID from URL
        project_id = self.supabase_url.replace('https://', '').replace('.supabase.co', '')

        # Build connection string
        self.conn_string = (
            f"postgres://postgres.{project_id}:{self.db_password}"
            f"@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres"
            f"?sslmode=require"
        )

        # Load metadata
        metadata_path = Path(__file__).resolve().parents[1] / 'trademark_metadata.json'
        print(f"📖 메타데이터 로딩: {metadata_path}")
        with open(metadata_path, 'r', encoding='utf-8') as f:
            self.metadata = json.load(f)
        print(f"✅ {len(self.metadata):,}개 상표 메타데이터 로드됨")

    def connect_db(self):
        """데이터베이스 연결"""
        print("🔌 PostgreSQL 연결 중...")
        self.conn = psycopg2.connect(self.conn_string)
        self.cur = self.conn.cursor()
        print("✅ 연결 성공!")

    def check_current_state(self):
        """현재 데이터 상태 확인"""
        print("\n📊 현재 데이터 상태 확인...")

        # 전체 레코드 수
        self.cur.execute("SELECT COUNT(*) FROM trademark_embeddings;")
        total = self.cur.fetchone()[0]
        print(f"총 레코드: {total:,}개")

        # 경로가 포함된 trademark_number 확인
        self.cur.execute("""
            SELECT COUNT(*) FROM trademark_embeddings
            WHERE trademark_number LIKE 'C:\\%' OR trademark_number LIKE '%KIPRIS%';
        """)
        path_count = self.cur.fetchone()[0]
        print(f"경로가 포함된 레코드: {path_count:,}개 ({path_count/total*100:.1f}%)")

        # NULL 메타데이터 확인
        self.cur.execute("""
            SELECT COUNT(*) FROM trademark_embeddings
            WHERE trademark_name IS NULL OR trademark_name = '';
        """)
        null_meta = self.cur.fetchone()[0]
        print(f"메타데이터 없는 레코드: {null_meta:,}개 ({null_meta/total*100:.1f}%)")

        # 샘플 데이터 확인
        print("\n🔍 샘플 데이터 (수정 전):")
        self.cur.execute("""
            SELECT trademark_number, filename, filepath, trademark_name
            FROM trademark_embeddings
            LIMIT 3;
        """)
        for row in self.cur.fetchall():
            print(f"  번호: {row[0][:50]}...")
            print(f"  파일: {row[1][:50]}...")
            print(f"  경로: {row[2][:50]}...")
            print(f"  이름: {row[3]}")
            print()

        return total, path_count, null_meta

    def fix_trademark_numbers(self):
        """trademark_number에서 순수 번호만 추출"""
        print("\n🔧 Step 1: trademark_number 수정 중...")

        # Windows 경로에서 파일명만 추출 후 확장자 제거
        # 예: "C:\KIPRIS_FULL\ALL_IMAGES\4020200123456.jpg" -> "4020200123456"
        self.cur.execute("""
            UPDATE trademark_embeddings
            SET trademark_number = regexp_replace(
                regexp_replace(trademark_number, '^.*[\\/]', ''),  -- 경로 제거
                '\\.jpg$', '',  -- 확장자 제거
                'i'
            )
            WHERE trademark_number LIKE '%\\%' OR trademark_number LIKE '%/%' OR trademark_number LIKE '%.jpg';
        """)

        affected = self.cur.rowcount
        self.conn.commit()
        print(f"✅ {affected:,}개 레코드의 trademark_number 수정 완료")

        # 결과 확인
        self.cur.execute("""
            SELECT trademark_number FROM trademark_embeddings
            WHERE LENGTH(trademark_number) > 50
            LIMIT 3;
        """)
        long_numbers = self.cur.fetchall()
        if long_numbers:
            print("⚠️  여전히 긴 번호가 있습니다:")
            for row in long_numbers:
                print(f"  {row[0]}")

    def fix_filenames(self):
        """filename을 trademark_number.jpg 형식으로 수정"""
        print("\n🔧 Step 2: filename 수정 중...")

        self.cur.execute("""
            UPDATE trademark_embeddings
            SET filename = trademark_number || '.jpg'
            WHERE filename != trademark_number || '.jpg';
        """)

        affected = self.cur.rowcount
        self.conn.commit()
        print(f"✅ {affected:,}개 레코드의 filename 수정 완료")

    def fix_filepaths(self):
        """filepath를 GCS 경로로 수정"""
        print("\n🔧 Step 3: filepath 수정 중...")

        self.cur.execute("""
            UPDATE trademark_embeddings
            SET filepath = 'gs://ipdr-trademark-images/' || trademark_number || '.jpg'
            WHERE filepath NOT LIKE 'gs://ipdr-trademark-images/%'
               OR filepath != 'gs://ipdr-trademark-images/' || trademark_number || '.jpg';
        """)

        affected = self.cur.rowcount
        self.conn.commit()
        print(f"✅ {affected:,}개 레코드의 filepath 수정 완료")

    def populate_metadata(self):
        """메타데이터 매칭 및 업데이트"""
        print("\n🔧 Step 4: 메타데이터 업데이트 중...")

        # 배치 단위로 처리
        batch_size = 1000
        self.cur.execute("SELECT COUNT(*) FROM trademark_embeddings;")
        total = self.cur.fetchone()[0]

        updated = 0
        not_found = 0

        for offset in range(0, total, batch_size):
            # 배치 데이터 조회
            self.cur.execute("""
                SELECT id, trademark_number
                FROM trademark_embeddings
                ORDER BY id
                LIMIT %s OFFSET %s;
            """, (batch_size, offset))

            batch = self.cur.fetchall()

            # 각 레코드에 대해 메타데이터 업데이트
            for record_id, trademark_number in batch:
                meta = self.metadata.get(trademark_number)

                if meta:
                    # 배열 필드 처리
                    product_codes = meta.get('product_codes', [])
                    product_classes = meta.get('product_classes', [])
                    vienna_codes = meta.get('vienna_codes', [])

                    # PostgreSQL 배열 형식으로 변환
                    product_codes_str = '{' + ','.join(f'"{c}"' for c in product_codes) + '}' if product_codes else None
                    product_classes_str = '{' + ','.join(f'"{c}"' for c in product_classes) + '}' if product_classes else None
                    vienna_codes_str = '{' + ','.join(f'"{c}"' for c in vienna_codes) + '}' if vienna_codes else None

                    self.cur.execute("""
                        UPDATE trademark_embeddings
                        SET
                            trademark_name = %s,
                            status = %s,
                            application_date = %s,
                            trademark_type_code = %s,
                            applicant_name = %s,
                            product_codes = %s,
                            product_classes = %s,
                            vienna_codes = %s,
                            trademark_type = %s
                        WHERE id = %s;
                    """, (
                        meta.get('trademark_name'),
                        meta.get('status', 'active'),
                        meta.get('application_date'),
                        meta.get('trademark_type_code'),
                        meta.get('applicant_name'),
                        product_codes_str,
                        product_classes_str,
                        vienna_codes_str,
                        meta.get('trademark_type'),
                        record_id
                    ))
                    updated += 1
                else:
                    not_found += 1

            # 배치 커밋
            self.conn.commit()

            # 진행 상황 출력
            progress = (offset + len(batch)) / total * 100
            print(f"진행: {offset + len(batch):,}/{total:,} ({progress:.1f}%) - 매칭: {updated:,}, 미발견: {not_found:,}", end='\r')

        print(f"\n✅ 메타데이터 업데이트 완료: {updated:,}개 매칭, {not_found:,}개 미발견")

    def verify_fixes(self):
        """수정 결과 검증"""
        print("\n✅ 수정 결과 검증...")

        # 경로가 포함된 레코드 확인
        self.cur.execute("""
            SELECT COUNT(*) FROM trademark_embeddings
            WHERE trademark_number LIKE '%\\%' OR trademark_number LIKE '%/%';
        """)
        remaining_paths = self.cur.fetchone()[0]
        print(f"경로가 남아있는 레코드: {remaining_paths:,}개")

        # 메타데이터가 채워진 레코드 확인
        self.cur.execute("""
            SELECT COUNT(*) FROM trademark_embeddings
            WHERE trademark_name IS NOT NULL AND trademark_name != '';
        """)
        filled_meta = self.cur.fetchone()[0]
        print(f"메타데이터가 채워진 레코드: {filled_meta:,}개")

        # 샘플 데이터 확인
        print("\n🔍 샘플 데이터 (수정 후):")
        self.cur.execute("""
            SELECT trademark_number, filename, filepath, trademark_name, applicant_name
            FROM trademark_embeddings
            WHERE trademark_name IS NOT NULL
            LIMIT 3;
        """)
        for row in self.cur.fetchall():
            print(f"  번호: {row[0]}")
            print(f"  파일: {row[1]}")
            print(f"  경로: {row[2]}")
            print(f"  상표명: {row[3]}")
            print(f"  출원인: {row[4]}")
            print()

    def run(self):
        """전체 수정 프로세스 실행"""
        try:
            self.connect_db()

            # 현재 상태 확인
            total, path_count, null_meta = self.check_current_state()

            if path_count == 0 and null_meta == 0:
                print("\n✅ 데이터가 이미 정상 상태입니다!")
                return

            # 사용자 확인
            print(f"\n⚠️  다음 작업을 수행합니다:")
            print(f"   - {path_count:,}개 레코드의 경로 수정")
            print(f"   - {null_meta:,}개 레코드의 메타데이터 채우기")
            print(f"\n계속하시겠습니까? (y/n): ", end='')

            response = input().strip().lower()
            if response != 'y':
                print("❌ 취소되었습니다.")
                return

            # 수정 작업 실행
            self.fix_trademark_numbers()
            self.fix_filenames()
            self.fix_filepaths()
            self.populate_metadata()

            # 결과 검증
            self.verify_fixes()

            print("\n🎉 모든 데이터 수정 완료!")

        except Exception as e:
            print(f"\n❌ 오류 발생: {e}")
            self.conn.rollback()
            raise
        finally:
            if hasattr(self, 'cur'):
                self.cur.close()
            if hasattr(self, 'conn'):
                self.conn.close()

if __name__ == '__main__':
    fixer = TrademarkDataFixer()
    fixer.run()
