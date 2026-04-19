#!/usr/bin/env python3
"""
Reorder mapper XML blocks:
  Standard order (top):
    <select id="selectById">
    <select id="selectList">
    <select id="selectPageList">
    <select id="selectPageCount">
    <update id="updateSelective">
    <delete id="deleteById">
  Everything else → below a section comment block
"""

import os, re, glob

MAPPER_ROOT = r"c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi\src\main\resources\mapper"

STANDARD_ORDER = [
    ("select", "selectById"),
    ("select", "selectList"),
    ("select", "selectPageList"),
    ("select", "selectPageCount"),
    ("update", "updateSelective"),
]

EXTRA_COMMENT = (
    "\n"
    "    <!-- ================================================================\n"
    "         확장 쿼리 (연관관계 조회 등)\n"
    "         ================================================================ -->"
)


def extract_blocks(inner: str):
    """
    Parse inner mapper content into blocks.
    Each block: {"tag": str, "elem_id": str, "text": str}
    tag == "other" means comments / whitespace between elements.
    """
    TOP_TAGS = ("sql", "select", "insert", "update", "delete")
    blocks = []
    i = 0
    n = len(inner)
    buf = []  # accumulate non-element lines

    lines = inner.split("\n")
    line_idx = 0

    while line_idx < len(lines):
        line = lines[line_idx]
        stripped = line.lstrip()

        # Check if this line opens a top-level element (4-space indent)
        m = re.match(r"^    <(" + "|".join(TOP_TAGS) + r")(\s|>)", line)
        if m:
            # Flush buffered "other" content
            if buf:
                other_text = "\n".join(buf)
                if other_text.strip():
                    blocks.append({"tag": "other", "elem_id": "", "text": other_text})
                buf = []

            tag = m.group(1)
            elem_id_m = re.search(r'id="([^"]+)"', line)
            elem_id = elem_id_m.group(1) if elem_id_m else ""

            # Collect lines until matching </tag> at 4-space indent
            block_lines = [line]
            end_pattern = f"    </{tag}>"
            open_pattern = f"<{tag}"
            depth = line.count(f"<{tag}") - line.count(f"</{tag}>")

            # Self-closing on same line?
            if depth <= 0:
                blocks.append({"tag": tag, "elem_id": elem_id, "text": line})
                line_idx += 1
                continue

            line_idx += 1
            while line_idx < len(lines):
                l = lines[line_idx]
                block_lines.append(l)
                depth += l.count(f"<{tag}") - l.count(f"</{tag}>")
                line_idx += 1
                if depth <= 0:
                    break

            blocks.append({"tag": tag, "elem_id": elem_id, "text": "\n".join(block_lines)})
        else:
            buf.append(line)
            line_idx += 1

    if buf:
        other_text = "\n".join(buf)
        if other_text.strip():
            blocks.append({"tag": "other", "elem_id": "", "text": other_text})

    return blocks


def reorder(path):
    with open(path, encoding="utf-8") as f:
        content = f.read()

    # Extract header (<mapper ...>) and footer (</mapper>)
    m_open = re.search(r"<mapper[^>]*>", content)
    m_close = content.rfind("</mapper>")
    if not m_open or m_close == -1:
        print(f"[SKIP] {os.path.basename(path)}")
        return

    header = content[: m_open.end()]
    inner = content[m_open.end(): m_close]
    footer = content[m_close:]

    blocks = extract_blocks(inner)

    # Separate <sql> fragment (always first), standard, and extra
    sql_blocks = [b for b in blocks if b["tag"] == "sql"]
    comment_blocks = [b for b in blocks if b["tag"] == "other"]

    std_map = {(tag, eid): None for tag, eid in STANDARD_ORDER}
    for b in blocks:
        key = (b["tag"], b["elem_id"])
        if key in std_map:
            std_map[key] = b

    extra_blocks = [
        b for b in blocks
        if b["tag"] not in ("sql", "other", "delete")
        and (b["tag"], b["elem_id"]) not in std_map
    ]

    # Build output
    parts = [header, "\n"]

    # Opening comment (keep first "other" block if it's a comment at top)
    if comment_blocks and comment_blocks[0]["text"].strip().startswith("<!--"):
        parts.append(comment_blocks[0]["text"])
        parts.append("\n\n")

    # <sql> fragments
    for b in sql_blocks:
        parts.append(b["text"])
        parts.append("\n\n")

    # Standard order
    for tag, eid in STANDARD_ORDER:
        b = std_map.get((tag, eid))
        if b:
            parts.append(b["text"])
            parts.append("\n\n")

    # Extra queries
    if extra_blocks:
        parts.append(EXTRA_COMMENT)
        parts.append("\n\n")
        for b in extra_blocks:
            parts.append(b["text"])
            parts.append("\n\n")

    parts.append(footer)
    parts.append("\n")

    result = "".join(parts)

    # Remove triple+ blank lines
    result = re.sub(r"\n{3,}", "\n\n", result)

    with open(path, "w", encoding="utf-8") as f:
        f.write(result)

    std_count = sum(1 for _, b in std_map.items() if b)
    print(f"[OK] {os.path.basename(path):35s}  std={std_count}  extra={len(extra_blocks)}")


def main():
    xml_files = glob.glob(os.path.join(MAPPER_ROOT, "**", "*.xml"), recursive=True)
    xml_files = [f for f in xml_files if "AutoRest" not in f]
    for path in sorted(xml_files):
        reorder(path)
    print("\nDone.")


if __name__ == "__main__":
    main()
