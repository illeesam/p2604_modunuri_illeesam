#!/usr/bin/env python3
"""모든 admin 컴포넌트에서 adminData/dispDataset Props 제거"""
import os
import re

def clean_props(content):
    """Props 배열에서 adminData/dispDataset 제거"""

    # props: [...] 패턴 찾기
    def remove_admin_from_props(match):
        props_str = match.group(1)

        # 'adminData', 'dispDataset' 제거 (쉼표 포함)
        props_str = re.sub(r",\s*['\"](?:admin|disp)Data['\"](?=\s*[,\]])", '', props_str)
        props_str = re.sub(r"['\"](?:admin|disp)Data['\"],\s*", '', props_str)

        return f"props: [{props_str}]"

    # 여러 줄 props 처리
    content = re.sub(
        r"props:\s*\[\s*([\s\S]*?)\s*\]",
        remove_admin_from_props,
        content
    )

    return content

def process_file(filepath):
    """한 파일 처리"""
    with open(filepath, 'r', encoding='utf-8') as f:
        original = f.read()

    content = clean_props(original)

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

def main():
    base = "c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/pages"

    count = 0
    for root, dirs, files in os.walk(base):
        for fname in files:
            if fname.endswith('.js'):
                fpath = os.path.join(root, fname)
                if process_file(fpath):
                    count += 1
                    print(f"[OK] {fname}")

    print(f"\n총 {count}개 파일 수정")

if __name__ == '__main__':
    main()
