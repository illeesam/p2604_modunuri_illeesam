#!/usr/bin/env python3
"""모든 admin 파일에서 props.adminData/props.dispDataset 제거"""
import os
import re

def remove_admindata_refs(content):
    """props.adminData, props.dispDataset 참조 모두 제거"""

    # 1. props.adminData.ARRAY -> ARRAY.value (로컬 변수가 이미 있다고 가정)
    # 예: props.adminData.members.find(...) -> members.value.find(...)
    content = re.sub(r'props\.adminData\.(\w+)', r'\1.value', content)
    content = re.sub(r'props\.dispDataset\.(\w+)', r'\1.value', content)

    # 2. window.adminData.ARRAY -> ARRAY.value
    # 단, AdminData.js와 헬퍼 메서드는 제외
    if 'AdminData.js' not in content and 'AdminModals.js' not in content:
        content = re.sub(r'window\.adminData\.(\w+)', r'\1.value', content)

    return content

def fix_undefined_refs(filepath):
    """undefined 참조 처리"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 이미 로컬 변수가 있는지 확인
    # 예: const members = ref([])
    has_local_members = 'const members = ref' in content
    has_local_products = 'const products = ref' in content
    has_local_orders = 'const orders = ref' in content
    has_local_claims = 'const claims = ref' in content

    # undefined인 경우 기본값 처리
    # 예: members.value || [] -> (members.value || [])
    if not has_local_members:
        content = re.sub(r'members\.value(?![\w])', 'members?.value || []', content)

    return content

def process_file(filepath):
    """한 파일 처리"""
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    content = remove_admindata_refs(original)
    # content = fix_undefined_refs(filepath)  # 선택적

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    base = "c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/pages/admin"

    files = []
    for root, dirs, fnames in os.walk(base):
        for fname in fnames:
            if fname.endswith('.js') and fname not in ['AdminData.js']:
                files.append(os.path.join(root, fname))

    files.sort()

    count = 0
    for fpath in files:
        fname = os.path.basename(fpath)
        if process_file(fpath):
            count += 1
            print(f"[OK] {fname}")

    print(f"\n총 {count}개 파일 수정 완료")

if __name__ == '__main__':
    main()
