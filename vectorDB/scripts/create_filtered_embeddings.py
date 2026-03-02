#!/usr/bin/env python3
"""
Type D (순수 텍스트)를 제외한 필터링된 임베딩 생성
"""

import numpy as np
import json
import ntpath
from pathlib import Path

# 경로
VECTORDB_PATH = Path('/Users/yuwichang/ipdr_mvp1/vectorDB')
EMBEDDINGS_FILE = VECTORDB_PATH / 'embeddings.npy'
FILENAMES_FILE = VECTORDB_PATH / 'filenames.json'
METADATA_FILE = VECTORDB_PATH / 'metadata_map.json'
OUTPUT_EMBEDDINGS = VECTORDB_PATH / 'filtered_embeddings.npy'
OUTPUT_FILENAMES = VECTORDB_PATH / 'filtered_filenames.json'

print("📂 데이터 로딩 중...")
print(f"   Embeddings: {EMBEDDINGS_FILE}")
embeddings = np.load(EMBEDDINGS_FILE)
print(f"   ✅ {embeddings.shape[0]:,}개 임베딩 로드 ({embeddings.shape})")

print(f"\n   Filenames: {FILENAMES_FILE}")
with open(FILENAMES_FILE, 'r', encoding='utf-8') as f:
    filenames = json.load(f)
print(f"   ✅ {len(filenames):,}개 파일명 로드")

print(f"\n   Metadata: {METADATA_FILE}")
with open(METADATA_FILE, 'r', encoding='utf-8') as f:
    metadata_map = json.load(f)
print(f"   ✅ {len(metadata_map):,}개 메타데이터 로드")

# 통계 출력
type_counts = {}
for tm_num, data in metadata_map.items():
    tm_type = data.get('trademark_type', '알 수 없음')
    type_counts[tm_type] = type_counts.get(tm_type, 0) + 1

print(f"\n📊 전체 상표 분류:")
for tm_type, count in sorted(type_counts.items(), key=lambda x: -x[1]):
    print(f"   {tm_type}: {count:,}개")

# 필터링
print(f"\n🔍 필터링 시작 (Type D 제외)...")
filtered_embeddings = []
filtered_filenames = []
type_d_count = 0
kept_type_counts = {}

for i, (emb, fname) in enumerate(zip(embeddings, filenames)):
    # 출원번호 추출
    base = ntpath.basename(fname).split('.')[0]
    # _tm 제거 (있으면)
    if '_tm' in base:
        tm_num = base.split('_tm')[0]
    else:
        tm_num = base

    # 메타데이터 확인
    if tm_num in metadata_map:
        tm_type = metadata_map[tm_num].get('trademark_type', '알 수 없음')

        # Type D가 아니면 유지
        if tm_type != 'Type D - 순수 텍스트':
            filtered_embeddings.append(emb)
            filtered_filenames.append(fname)
            kept_type_counts[tm_type] = kept_type_counts.get(tm_type, 0) + 1
        else:
            type_d_count += 1
    else:
        # 메타데이터 없으면 유지 (안전)
        filtered_embeddings.append(emb)
        filtered_filenames.append(fname)
        kept_type_counts['메타데이터 없음'] = kept_type_counts.get('메타데이터 없음', 0) + 1

    if (i + 1) % 50000 == 0:
        print(f"   진행: {i+1:,}/{len(filenames):,} (Type D 제외: {type_d_count:,})")

print(f"\n✅ 필터링 완료!")
print(f"   원본: {len(filenames):,}개")
print(f"   삭제 (Type D): {type_d_count:,}개")
print(f"   유지: {len(filtered_embeddings):,}개")

print(f"\n📊 유지된 상표 분류:")
for tm_type, count in sorted(kept_type_counts.items(), key=lambda x: -x[1]):
    print(f"   {tm_type}: {count:,}개")

# 저장
print(f"\n💾 저장 중...")
filtered_embeddings = np.array(filtered_embeddings)

print(f"   Embeddings: {OUTPUT_EMBEDDINGS}")
np.save(OUTPUT_EMBEDDINGS, filtered_embeddings)
size_mb = filtered_embeddings.nbytes / (1024**2)
print(f"   ✅ {size_mb:.1f} MB 저장 ({filtered_embeddings.shape})")

print(f"\n   Filenames: {OUTPUT_FILENAMES}")
with open(OUTPUT_FILENAMES, 'w', encoding='utf-8') as f:
    json.dump(filtered_filenames, f, ensure_ascii=False, indent=2)
print(f"   ✅ {len(filtered_filenames):,}개 저장")

print(f"\n🎉 완료! 다음 파일 생성:")
print(f"   - {OUTPUT_EMBEDDINGS}")
print(f"   - {OUTPUT_FILENAMES}")
print(f"\n📌 다음 단계: migrate_with_copy.py 실행")
