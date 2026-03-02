#!/usr/bin/env python3
"""
Migration Monitoring Script
실시간으로 마이그레이션 진행 상황을 모니터링합니다.
"""

import json
import time
from pathlib import Path
from datetime import datetime, timedelta

def format_time(seconds):
    """초를 읽기 쉬운 형식으로 변환"""
    if seconds < 60:
        return f"{seconds:.0f}초"
    elif seconds < 3600:
        return f"{seconds/60:.0f}분"
    else:
        hours = seconds / 3600
        return f"{hours:.1f}시간"

def monitor_migration(interval=60):
    """마이그레이션 진행 상황 모니터링

    Args:
        interval: 체크 간격 (초)
    """
    checkpoint_file = Path(__file__).parent / 'migration_checkpoint.json'

    if not checkpoint_file.exists():
        print("❌ 체크포인트 파일을 찾을 수 없습니다.")
        return

    print("🔍 마이그레이션 모니터링 시작...")
    print(f"📊 {interval}초마다 체크합니다.\n")
    print("=" * 80)

    prev_checkpoint = None
    prev_time = None

    try:
        while True:
            with open(checkpoint_file, 'r') as f:
                checkpoint = json.load(f)

            stats = checkpoint['stats']
            last_index = checkpoint['last_index']
            timestamp = checkpoint.get('timestamp', time.time())

            # 진행률 계산
            total = stats['total']
            processed = stats['processed']
            success = stats['success']
            failed = stats['failed']
            remaining = total - last_index
            progress_pct = (last_index / total) * 100

            # 현재 시간
            now = datetime.now()
            checkpoint_time = datetime.fromtimestamp(timestamp)

            # 속도 계산 (이전 체크와 비교)
            speed_str = "계산 중..."
            eta_str = "계산 중..."

            if prev_checkpoint and prev_time:
                time_diff = time.time() - prev_time
                records_diff = last_index - prev_checkpoint['last_index']

                if time_diff > 0:
                    speed = records_diff / time_diff
                    speed_str = f"{speed:.2f} records/s"

                    if speed > 0:
                        eta_seconds = remaining / speed
                        eta_str = format_time(eta_seconds)
                        eta_time = now + timedelta(seconds=eta_seconds)
                        eta_str += f" (완료 예상: {eta_time.strftime('%H:%M:%S')})"

            # 출력
            print(f"\n⏰ {now.strftime('%Y-%m-%d %H:%M:%S')}")
            print(f"📍 진행 상황: {last_index:,} / {total:,} ({progress_pct:.2f}%)")
            print(f"✅ 성공: {success:,} | ❌ 실패: {failed}")
            print(f"📦 남은 레코드: {remaining:,}")
            print(f"⚡ 현재 속도: {speed_str}")
            print(f"🕐 예상 완료: {eta_str}")
            print(f"📝 마지막 체크포인트: {checkpoint_time.strftime('%H:%M:%S')}")
            print("-" * 80)

            # 이전 값 저장
            prev_checkpoint = checkpoint.copy()
            prev_time = time.time()

            # 완료 확인
            if last_index >= total:
                print("\n" + "=" * 80)
                print("🎉 마이그레이션 완료!")
                print(f"✅ 총 성공: {success:,}")
                print(f"❌ 총 실패: {failed}")
                print(f"📊 성공률: {(success/processed*100):.2f}%")
                print("=" * 80)
                break

            # 대기
            time.sleep(interval)

    except KeyboardInterrupt:
        print("\n\n⚠️  모니터링 중단됨")
        print("📍 마이그레이션은 백그라운드에서 계속 실행 중입니다.")
    except Exception as e:
        print(f"\n❌ 오류 발생: {e}")

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='마이그레이션 진행 상황 모니터링')
    parser.add_argument('--interval', type=int, default=60, help='체크 간격 (초, 기본값: 60)')

    args = parser.parse_args()
    monitor_migration(interval=args.interval)
