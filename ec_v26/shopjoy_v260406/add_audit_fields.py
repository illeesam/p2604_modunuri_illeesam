"""
모든 DDL .sql 파일에 감사 필드 4개(reg_by, reg_date, upd_by, upd_date)를 추가.
누락된 항목만 추가하고, COMMENT ON COLUMN 도 함께 추가.
ALTER TABLE SQL 도 생성.
"""
import os, re, sys

DDL_BASE = "c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_doc"
SCHEMA   = "shopjoy_2604"

AUDIT_COLS = {
    'reg_by':   '    reg_by          VARCHAR(20),\n',
    'reg_date': '    reg_date        TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,\n',
    'upd_by':   '    upd_by          VARCHAR(20),\n',
    'upd_date': '    upd_date        TIMESTAMP,\n',
}

AUDIT_COMMENTS = {
    'reg_by':   "COMMENT ON COLUMN {t}.reg_by   IS '등록자 (sy_user.user_id, mb_member.member_id)';\n",
    'reg_date': "COMMENT ON COLUMN {t}.reg_date IS '등록일';\n",
    'upd_by':   "COMMENT ON COLUMN {t}.upd_by   IS '수정자 (sy_user.user_id, mb_member.member_id)';\n",
    'upd_date': "COMMENT ON COLUMN {t}.upd_date IS '수정일';\n",
}

alter_sqls = []

def get_table_name(content):
    m = re.search(r'CREATE TABLE (\w+)', content)
    return m.group(1) if m else None

def has_col(content, col):
    # match col as standalone word in CREATE TABLE block only
    return bool(re.search(r'\b' + col + r'\b', content))

def add_before_constraint(content, cols_to_add):
    """CREATE TABLE 내 PRIMARY KEY / UNIQUE / ); 직전에 컬럼 삽입"""
    col_text = ''.join(AUDIT_COLS[c] for c in cols_to_add)
    # Insert before first PRIMARY KEY or UNIQUE inside CREATE TABLE
    m = re.search(r'([ \t]+(PRIMARY KEY|UNIQUE)\b)', content)
    if m:
        pos = m.start()
        return content[:pos] + col_text + content[pos:]
    # Fallback: before closing );
    m = re.search(r'\n\);', content)
    if m:
        return content[:m.start()] + '\n' + col_text.rstrip(',\n') + '\n' + content[m.start():]
    return content

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    table = get_table_name(content)
    if not table:
        return

    ALL = ['reg_by', 'reg_date', 'upd_by', 'upd_date']
    missing = [c for c in ALL if not has_col(content, c)]
    if not missing:
        return

    print(f"[{table}] missing: {missing}")
    nc = content

    # ── INSERT INTO CREATE TABLE ─────────────────────────────
    # Strategy: handle each missing field in a logical order

    # Case A: upd_by + upd_date both missing → add after reg_date line
    if 'upd_by' in missing and 'upd_date' in missing:
        if has_col(nc, 'reg_date'):
            nc = re.sub(
                r'([ \t]+reg_date[ \t]+[^\n]+\n)',
                r'\1' + AUDIT_COLS['upd_by'] + AUDIT_COLS['upd_date'],
                nc, count=1
            )
        else:
            # No reg_date yet either — will be handled below
            pass

    # Case B: upd_by missing (upd_date exists) → add before upd_date
    elif 'upd_by' in missing and 'upd_date' not in missing:
        nc = re.sub(
            r'([ \t]+upd_date[ \t]+[^\n]+\n)',
            AUDIT_COLS['upd_by'] + r'\1',
            nc, count=1
        )

    # Case C: upd_date missing (upd_by exists) → add after upd_by
    elif 'upd_date' in missing and 'upd_by' not in missing:
        nc = re.sub(
            r'([ \t]+upd_by[ \t]+[^\n]+\n)',
            r'\1' + AUDIT_COLS['upd_date'],
            nc, count=1
        )

    # reg_by missing → insert before reg_date
    if 'reg_by' in missing:
        if has_col(nc, 'reg_date'):
            nc = re.sub(
                r'([ \t]+reg_date[ \t]+[^\n]+\n)',
                AUDIT_COLS['reg_by'] + r'\1',
                nc, count=1
            )
        else:
            # No reg_date either → insert both before PRIMARY KEY
            nc = add_before_constraint(nc, ['reg_by', 'reg_date'])
            missing_now = [c for c in ALL if not has_col(nc, c)]
            if missing_now:
                nc = add_before_constraint(nc, missing_now)

    # reg_date missing (reg_by exists) → insert after reg_by
    if 'reg_date' in missing and has_col(nc, 'reg_by'):
        nc = re.sub(
            r'([ \t]+reg_by[ \t]+[^\n]+\n)',
            r'\1' + AUDIT_COLS['reg_date'],
            nc, count=1
        )

    # ── ADD COMMENT ON COLUMN ───────────────────────────────
    comment_pattern = rf'(COMMENT ON COLUMN {table}\.\w+[^\n]*\n)'
    matches = list(re.finditer(comment_pattern, nc))
    if matches:
        last_end = matches[-1].end()
        additions = ''
        for col in ['reg_by', 'reg_date', 'upd_by', 'upd_date']:
            if col in missing:
                additions += AUDIT_COMMENTS[col].format(t=table)
        nc = nc[:last_end] + additions + nc[last_end:]

    # ── GENERATE ALTER TABLE SQL ─────────────────────────────
    for col in ['reg_by', 'reg_date', 'upd_by', 'upd_date']:
        if col not in missing:
            continue
        if col == 'reg_by':
            alter_sqls.append(f"ALTER TABLE {SCHEMA}.{table} ADD COLUMN IF NOT EXISTS reg_by VARCHAR(20);")
        elif col == 'reg_date':
            alter_sqls.append(f"ALTER TABLE {SCHEMA}.{table} ADD COLUMN IF NOT EXISTS reg_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;")
        elif col == 'upd_by':
            alter_sqls.append(f"ALTER TABLE {SCHEMA}.{table} ADD COLUMN IF NOT EXISTS upd_by VARCHAR(20);")
        elif col == 'upd_date':
            alter_sqls.append(f"ALTER TABLE {SCHEMA}.{table} ADD COLUMN IF NOT EXISTS upd_date TIMESTAMP;")

    if nc != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(nc)
        print(f"  -> saved")

# ── main ──────────────────────────────────────────────────────
for root, dirs, files in os.walk(DDL_BASE):
    dirs.sort()
    for fn in sorted(files):
        if fn.endswith('.sql'):
            process_file(os.path.join(root, fn))

print(f"\n=== ALTER TABLE SQL ({len(alter_sqls)} statements) ===")
for s in alter_sqls:
    print(s)

# Write ALTER SQL to file
out_path = "c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/_doc/alter_audit_fields.sql"
with open(out_path, 'w', encoding='utf-8') as f:
    f.write("-- Auto-generated: ADD COLUMN audit fields\n")
    f.write(f"-- Schema: {SCHEMA}\n\n")
    for s in alter_sqls:
        f.write(s + '\n')
print(f"\nAlter SQL saved to: {out_path}")
