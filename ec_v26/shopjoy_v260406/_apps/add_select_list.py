#!/usr/bin/env python3
"""
Add selectList (no pagination) after selectPageCount in all mapper XMLs.
selectList = selectPageList without LIMIT/OFFSET, reusing the same condition fragment.
"""

import os, re, glob

MAPPER_ROOT = r"c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi\src\main\resources\mapper"

def add_select_list(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()

    if "selectPageList" not in content:
        print(f"[SKIP] {os.path.basename(path)} - no selectPageList")
        return

    if '<select id="selectList"' in content:
        print(f"[SKIP-exists] {os.path.basename(path)}")
        return

    # Find the selectPageList block and extract its resultType and body
    # Pattern: <select id="selectPageList" resultType="...">  ...  LIMIT ...  </select>
    pl_match = re.search(
        r'(<select id="selectPageList" resultType="([^"]+)">)(.*?)(</select>)',
        content, re.DOTALL
    )
    if not pl_match:
        print(f"[SKIP-nopagelist] {os.path.basename(path)}")
        return

    result_type = pl_match.group(2)
    page_body = pl_match.group(3)

    # Remove LIMIT/OFFSET line from body
    list_body = re.sub(r'\s*LIMIT #\{p\.limit\} OFFSET #\{p\.offset\}', '', page_body)
    # Also remove trailing blank lines
    list_body = list_body.rstrip()

    select_list_block = (
        f'\n    <select id="selectList" resultType="{result_type}">'
        + list_body
        + "\n    </select>\n"
    )

    # Insert after </select> of selectPageCount
    pc_end = content.find("</select>", content.find('<select id="selectPageCount"'))
    pc_end += len("</select>")

    new_content = content[:pc_end] + select_list_block + content[pc_end:]

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"[OK] {os.path.basename(path)}")


def main():
    xml_files = glob.glob(os.path.join(MAPPER_ROOT, "**", "*.xml"), recursive=True)
    xml_files = [f for f in xml_files if "AutoRest" not in f]
    for path in sorted(xml_files):
        add_select_list(path)
    print("\nDone.")


if __name__ == "__main__":
    main()
