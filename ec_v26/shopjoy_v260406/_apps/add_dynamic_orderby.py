#!/usr/bin/env python3
"""
selectList / selectPageList 의 고정 ORDER BY 를
<choose> 기반 동적 정렬로 교체.

지원 정렬키 (p.sort):
  id_asc / id_desc   → PK 기준
  nm_asc / nm_desc   → 이름 컬럼 기준 (name_col 있을 때만)
  reg_asc / reg_desc → 등록일(reg_date 계열) 기준 (컬럼 있을 때만)
  otherwise          → 현재 고정 ORDER BY (default)
"""

import os, re, glob

DDL_ROOT    = r"c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_doc"
MAPPER_ROOT = r"c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi\src\main\resources\mapper"

FOLDER_MAP = {
    "ddlPgsql-ec-cm": "cm",
    "ddlPgsql-ec-dp": "dp",
    "ddlPgsql-ec-mb": "mb",
    "ddlPgsql-ec-od": "od",
    "ddlPgsql-ec-pd": "pd",
    "ddlPgsql-ec-pm": "pm",
    "ddlPgsql-ec-st": "st",
    "ddlPgsql-sy":    "sy",
}

DATE_COLS = {'reg_date','order_date','join_date','issue_date','send_date',
             'alarm_send_date','settle_ym','created_at'}


# ── DDL 파싱 (enhance_mappers.py 와 동일 로직) ────────────────────
def parse_ddl(sql):
    ct = re.search(r'CREATE TABLE\s+(?:\w+\.)?\s*(\w+)\s*\(', sql, re.IGNORECASE)
    if not ct: return None, None
    tname = ct.group(1)

    depth = body_start = body_end = 0; body_start = -1
    for i in range(ct.start(), len(sql)):
        ch = sql[i]
        if ch == '(':
            if depth == 0: body_start = i + 1
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0: body_end = i; break
    if body_start < 0 or body_end < 0: return tname, None

    body = sql[body_start:body_end]
    pk_m = re.search(r'PRIMARY KEY\s*\(([^)]+)\)', body, re.IGNORECASE)
    pk_cols = [c.strip() for c in pk_m.group(1).split(',')] if pk_m else []

    columns = []
    for line in body.split('\n'):
        clean = re.sub(r'--.*$', '', line).strip().rstrip(',').strip()
        if not clean: continue
        first = clean.split()[0].upper()
        if first in ('PRIMARY','UNIQUE','FOREIGN','CHECK','CONSTRAINT','INDEX'): continue
        m = re.match(r'(\w+)\s+', clean)
        if m: columns.append(m.group(1))

    name_col = None
    for suffix in ('_nm', '_title', '_name'):
        for c in columns:
            if c not in pk_cols and c.endswith(suffix):
                name_col = c; break
        if name_col: break

    date_col = next((c for c in columns if c in DATE_COLS), None)

    return tname, {
        'pk':       pk_cols[0] if pk_cols else None,
        'columns':  columns,
        'name_col': name_col,
        'date_col': date_col,
    }


# ── <choose> 블록 생성 ────────────────────────────────────────────
def build_choose(alias, pk_col, name_col, date_col, current_order, ind='        '):
    i2 = ind + '    '

    def w(key, expr):
        return f'{i2}<when test="p.sort == \'{key}\'">{expr}</when>'

    lines = [f'{ind}<choose>']

    if pk_col:
        lines.append(w('id_asc',   f'ORDER BY {alias}.{pk_col} ASC'))
        lines.append(w('id_desc',  f'ORDER BY {alias}.{pk_col} DESC'))

    if name_col:
        lines.append(w('nm_asc',   f'ORDER BY {alias}.{name_col} ASC'))
        lines.append(w('nm_desc',  f'ORDER BY {alias}.{name_col} DESC'))

    if date_col:
        lines.append(w('reg_asc',  f'ORDER BY {alias}.{date_col} ASC'))
        lines.append(w('reg_desc', f'ORDER BY {alias}.{date_col} DESC'))

    lines.append(f'{i2}<otherwise>{current_order}</otherwise>')
    lines.append(f'{ind}</choose>')
    return '\n'.join(lines)


# ── 단일 select 블록 재작성 ──────────────────────────────────────
ORDER_RE   = re.compile(r'^([ \t]+)(ORDER BY\s+.+)$', re.MULTILINE)
CHOOSE_RE  = re.compile(r'([ \t]*)<choose>(.*?)</choose>', re.DOTALL)
OTHERW_RE  = re.compile(r'<otherwise>(.*?)</otherwise>', re.DOTALL)

def rewrite_block_order(block_body, alias, schema):
    """ORDER BY 줄 또는 기존 <choose> 를 올바른 <choose> 로 교체."""

    # ── 이미 <choose> 가 있으면 교체
    cm = CHOOSE_RE.search(block_body)
    if cm:
        indent = cm.group(1)
        oth_m  = OTHERW_RE.search(cm.group(2))
        current_order = oth_m.group(1).strip() if oth_m else 'ORDER BY 1'
        choose = build_choose(alias, schema.get('pk'), schema.get('name_col'),
                              schema.get('date_col'), current_order, indent)
        new_body = block_body[:cm.start()] + choose + block_body[cm.end():]
        return new_body, True

    # ── 고정 ORDER BY 줄 교체
    om = ORDER_RE.search(block_body)
    if not om:
        return block_body, False

    indent        = om.group(1)
    current_order = om.group(2).strip()
    choose = build_choose(alias, schema.get('pk'), schema.get('name_col'),
                          schema.get('date_col'), current_order, indent)
    new_body = block_body[:om.start()] + choose + block_body[om.end():]
    return new_body, True


# ── 전체 파일 처리 ────────────────────────────────────────────────
SELECT_RE = re.compile(
    r'(<select id="(?:selectList|selectPageList)"[^>]*>)(.*?)(</select>)',
    re.DOTALL
)

def process_mapper(xml_path, schema_db):
    content = open(xml_path, encoding='utf-8').read()

    # FROM 절에서 테이블명·별칭 추출
    from_m = re.search(r'FROM\s+(\w+)\s+(\w+)', content)
    if not from_m:
        return 'NO-FROM'

    table_name = from_m.group(1)
    alias      = from_m.group(2)
    schema     = schema_db.get(table_name, {})

    changed = False

    def replacer(m):
        nonlocal changed
        new_body, ok = rewrite_block_order(m.group(2), alias, schema)
        if ok:
            changed = True
        return m.group(1) + new_body + m.group(3)

    new_content = SELECT_RE.sub(replacer, content)

    if not changed:
        return 'NO-ORDER'

    open(xml_path, 'w', encoding='utf-8').write(new_content)
    return 'OK'


# ── main ─────────────────────────────────────────────────────────
def main():
    schema_db = {}
    for folder in FOLDER_MAP:
        ddl_dir = os.path.join(DDL_ROOT, folder)
        if not os.path.isdir(ddl_dir): continue
        for sql_path in glob.glob(os.path.join(ddl_dir, '*.sql')):
            try:
                tn, s = parse_ddl(open(sql_path, encoding='utf-8').read())
                if tn and s: schema_db[tn] = s
            except Exception as e:
                print(f"[DDL-ERR] {os.path.basename(sql_path)}: {e}")

    print(f"Schema DB: {len(schema_db)} tables\n")

    counts = {}
    for xml_path in sorted(glob.glob(os.path.join(MAPPER_ROOT,'**','*.xml'), recursive=True)):
        if 'AutoRest' in xml_path: continue
        r    = process_mapper(xml_path, schema_db)
        name = os.path.basename(xml_path)
        counts[r] = counts.get(r, 0) + 1
        if r == 'OK':
            print(f"[OK]      {name}")
        elif r == 'EXISTS':
            print(f"[SKIP]    {name}  ← already has <choose>")
        elif r == 'NO-ORDER':
            print(f"[NO-ORD]  {name}")
        else:
            print(f"[{r}]  {name}")

    print(f"\n완료: {counts}")


if __name__ == '__main__':
    main()
