#!/usr/bin/env python3
"""
Refactor all Mapper XMLs:
  selectList  → selectPageList
  selectCount → selectPageCount
  Extract shared <where> condition into <sql id="whereCondition"> fragment
"""

import os, re, glob

MAPPER_ROOT = r"c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi\src\main\resources\mapper"

def extract_where_block(text):
    """Extract the first <where>...</where> block (supports nested tags)."""
    start = text.find("<where>")
    if start == -1:
        return None, -1, -1
    depth = 0
    i = start
    while i < len(text):
        if text[i:i+7] == "<where>":
            depth += 1
            i += 7
        elif text[i:i+8] == "</where>":
            depth -= 1
            i += 8
            if depth == 0:
                return text[start:i], start, i
        else:
            i += 1
    return None, -1, -1


def refactor_xml(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()

    # Skip if already refactored
    if "selectPageList" in content:
        print(f"[SKIP-already] {os.path.basename(path)}")
        return

    # Derive sql id from mapper namespace
    ns_match = re.search(r'namespace="([^"]+)"', content)
    if not ns_match:
        print(f"[SKIP-nons] {os.path.basename(path)}")
        return
    class_name = ns_match.group(1).split(".")[-1]  # e.g. MbMemberMapper

    # Extract the <where> block from selectList (first occurrence)
    where_block, ws, we = extract_where_block(content)
    if not where_block:
        print(f"[SKIP-nowhere] {os.path.basename(path)}")
        return

    # Check if there's a second <where> block (selectCount)
    rest = content[we:]
    where_block2, ws2, we2 = extract_where_block(rest)

    # Normalize: strip leading/trailing whitespace from each condition line
    # The where block is the same in both — use the first one as canonical
    indent = "        "
    sql_id = f"{class_name[0].lower()}{class_name[1:]}Condition"  # mbMemberMapperCondition → too long
    # Shorter: derive from class without "Mapper" suffix
    entity = class_name.replace("Mapper", "")  # MbMember
    sql_id = f"{entity[0].lower()}{entity[1:]}Cond"  # mbMemberCond

    # Build the <sql> fragment
    sql_fragment = f'    <sql id="{sql_id}">\n'
    sql_fragment += where_block + "\n"
    sql_fragment += "    </sql>\n"

    include_tag = f"        <include refid=\"{sql_id}\"/>"

    # Replace the two <where> blocks with <include>
    # First occurrence (in selectList/selectPageList)
    new_content = content[:ws] + include_tag + content[we:]

    # Second occurrence offset shifts by (len(include_tag) - (we - ws))
    shift = len(include_tag) - (we - ws)
    if where_block2:
        abs_ws2 = we + ws2 + shift
        abs_we2 = we + we2 + shift
        new_content = new_content[:abs_ws2] + include_tag + new_content[abs_we2:]

    # Rename selectList → selectPageList, selectCount → selectPageCount
    new_content = new_content.replace(
        'id="selectList"', 'id="selectPageList"'
    ).replace(
        'id="selectCount"', 'id="selectPageCount"'
    )

    # Insert the <sql> fragment after the first comment block (before first <select>)
    first_select = new_content.find("    <select")
    if first_select == -1:
        first_select = new_content.find("    <insert")
    if first_select == -1:
        first_select = new_content.find("    <update")

    new_content = (
        new_content[:first_select]
        + sql_fragment
        + "\n"
        + new_content[first_select:]
    )

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print(f"[OK] {os.path.basename(path)}  (sql_id={sql_id})")


def main():
    xml_files = glob.glob(os.path.join(MAPPER_ROOT, "**", "*.xml"), recursive=True)
    # exclude AutoRestMapper
    xml_files = [f for f in xml_files if "AutoRest" not in f]
    for path in sorted(xml_files):
        refactor_xml(path)
    print("\nDone.")


if __name__ == "__main__":
    main()
