#!/usr/bin/env python3
"""
Enhance MyBatis Mapper XML:
  - _cd 컬럼 → LEFT JOIN sy_code → code_label AS _cd_nm
  - _id FK 컬럼 → LEFT JOIN 원장 테이블 → name_col AS _nm (충돌시 _id_nm)
기존에 LEFT JOIN 이 있는 파일은 건너뜀.
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

# 테이블 JOIN 시 사용할 고정 별칭
PREFERRED_ALIAS = {
    'sy_site':      'ste',
    'sy_brand':     'brd',
    'sy_vendor':    'vnd',
    'sy_user':      'usr',
    'sy_dept':      'dpt',
    'sy_role':      'rol',
    'sy_menu':      'mnu',
    'sy_template':  'tpl',
    'mb_member':    'mem',
    'pd_category':  'cat',
    'pd_prod':      'prd',
    'pd_prod_sku':  'sku',
    'pm_coupon':    'cpn',
    'pm_event':     'evt',
    'cm_bltn_cate': 'bct',
    'sy_attach_grp':'atg',
}

# DDL 주석 없이도 항상 적용할 FK (명확한 것만)
ALWAYS_FK = {
    'site_id': 'sy_site',
}


# ──────────────────────────────────────────────
# 헬퍼
# ──────────────────────────────────────────────

def unique_alias(base, used):
    a, i = base, 2
    while a in used:
        a = base + str(i); i += 1
    used.add(a)
    return a


def code_alias_base(grp):
    """MEMBER_GRADE → cd_mg"""
    return 'cd_' + ''.join(w[0].lower() for w in grp.split('_'))


# ──────────────────────────────────────────────
# DDL 파싱
# ──────────────────────────────────────────────

def parse_ddl(sql):
    ct = re.search(r'CREATE TABLE\s+(?:\w+\.)?\s*(\w+)\s*\(', sql, re.IGNORECASE)
    if not ct:
        return None, None
    table_name = ct.group(1)

    # 괄호 본문 추출
    depth = body_start = body_end = 0
    body_start = -1
    for i in range(ct.start(), len(sql)):
        ch = sql[i]
        if ch == '(':
            if depth == 0: body_start = i + 1
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0: body_end = i; break

    if body_start < 0 or body_end < 0:
        return table_name, None

    body = sql[body_start:body_end]

    pk_m = re.search(r'PRIMARY KEY\s*\(([^)]+)\)', body, re.IGNORECASE)
    pk_cols = [c.strip() for c in pk_m.group(1).split(',')] if pk_m else []

    columns   = []
    code_cols = {}   # col → code_grp
    fk_cols   = {}   # col → ref_table

    for line in body.split('\n'):
        comment = ''
        cm = re.search(r'--\s*(.+)$', line)
        if cm: comment = cm.group(1).strip()

        clean = re.sub(r'--.*$', '', line).strip().rstrip(',').strip()
        if not clean: continue
        first = clean.split()[0].upper()
        if first in ('PRIMARY','UNIQUE','FOREIGN','CHECK','CONSTRAINT','INDEX'): continue

        m = re.match(r'(\w+)\s+', clean)
        if not m: continue
        col = m.group(1)
        columns.append(col)

        if col in pk_cols: continue

        # _cd 컬럼 + 코드 그룹 감지 (영문 대문자만 코드그룹으로 인정)
        if col.endswith('_cd') and not col.endswith('_before'):
            grp_m = re.search(r'코드[:：]\s*([A-Z][A-Z_0-9]+)', comment)
            if grp_m:
                code_cols[col] = grp_m.group(1)

        # _id FK 컬럼 감지 (DDL 주석 기준)
        elif col.endswith('_id'):
            # 패턴: table_name.col_name (소문자로 시작하는 단어)
            fk_m = re.search(r'(?:FK:\s*)?([a-z][a-z0-9_]+)\.(\w+)', comment)
            if fk_m:
                ref = fk_m.group(1)
                if not any(ref.endswith(s) for s in ('hist','log','token')):
                    fk_cols[col] = ref

    # ALWAYS_FK: DDL 주석 없어도 추가
    for col, ref in ALWAYS_FK.items():
        if col in columns and col not in pk_cols and col not in fk_cols:
            fk_cols[col] = ref

    # name_col: 첫 번째 *_nm → *_title → *_name 순
    name_col = None
    for suffix in ('_nm', '_title', '_name'):
        for c in columns:
            if c not in pk_cols and c.endswith(suffix):
                name_col = c; break
        if name_col: break

    return table_name, {
        'pk':        pk_cols[0] if pk_cols else None,
        'pk_cols':   pk_cols,
        'columns':   columns,
        'name_col':  name_col,
        'code_cols': code_cols,
        'fk_cols':   fk_cols,
    }


# ──────────────────────────────────────────────
# 매퍼 XML 재작성
# ──────────────────────────────────────────────

SELECT_BLOCK_RE = re.compile(
    r'(<select id="(?:selectById|selectList|selectPageList)"[^>]*>)(.*?)(</select>)',
    re.DOTALL
)


def rewrite_block(block_body, main_alias, table_name, select_extras, join_lines):
    lines = block_body.split('\n')
    out = []
    sel_done = from_done = False

    for line in lines:
        s = line.strip()

        # SELECT alias.* 교체
        if not sel_done and re.match(r'SELECT\s+' + re.escape(main_alias) + r'\.\*\s*$', s):
            ind = ' ' * (len(line) - len(line.lstrip()))
            out.append(f'{ind}SELECT')
            has_extras = bool(select_extras)
            out.append(f'{ind}    {main_alias}.*{"," if has_extras else ""}')
            for i, ex in enumerate(select_extras):
                comma = ',' if i < len(select_extras) - 1 else ''
                out.append(f'{ind}    {ex}{comma}')
            sel_done = True
            continue

        # FROM 줄 이후 JOIN 삽입
        if sel_done and not from_done:
            if re.match(r'FROM\s+' + re.escape(table_name) + r'\s+' + re.escape(main_alias), s):
                out.append(line)
                out.extend(join_lines)
                from_done = True
                continue

        out.append(line)

    return '\n'.join(out)


def enhance_mapper(xml_path, schema_db):
    content = open(xml_path, encoding='utf-8').read()

    if 'LEFT JOIN' in content:
        return 'EXISTS'

    from_m = re.search(r'FROM\s+(\w+)\s+(\w+)', content)
    if not from_m:
        return 'NO-FROM'

    table_name = from_m.group(1)
    main_alias = from_m.group(2)

    if table_name not in schema_db:
        return 'NO-SCHEMA'

    schema = schema_db[table_name]
    used = {main_alias}
    select_extras = []
    join_lines    = []

    # ── FK JOIN ──────────────────────────────
    for col, ref_table in schema['fk_cols'].items():
        if ref_table not in schema_db:
            continue
        ref = schema_db[ref_table]
        if not ref.get('name_col'):
            continue

        base = PREFERRED_ALIAS.get(ref_table, ref_table.split('_')[-1][:3])
        alias = unique_alias(base, used)

        ref_pk   = ref.get('pk', col)
        ref_name = ref['name_col']

        # SELECT 별칭: site_id → site_nm, 충돌시 site_id_nm
        prefix    = col[:-3] if col.endswith('_id') else col
        sel_alias = prefix + '_nm'
        if sel_alias in schema['columns']:
            sel_alias = col + '_nm'

        join_lines.append(
            f"            LEFT JOIN {ref_table} {alias}"
            f" ON {alias}.{ref_pk} = {main_alias}.{col}")
        select_extras.append(f"{alias}.{ref_name} AS {sel_alias}")

    # ── 코드 JOIN ────────────────────────────
    for col, grp in schema['code_cols'].items():
        alias = unique_alias(code_alias_base(grp), used)
        join_lines.append(
            f"            LEFT JOIN sy_code {alias}"
            f" ON {alias}.code_grp = '{grp}' AND {alias}.code_value = {main_alias}.{col}")
        select_extras.append(f"{alias}.code_label AS {col}_nm")

    if not join_lines:
        return 'NO-JOINS'

    # ── 각 select 블록 재작성 ─────────────────
    def replace_block(m):
        return (m.group(1)
                + rewrite_block(m.group(2), main_alias, table_name,
                                select_extras, join_lines)
                + m.group(3))

    new_content = SELECT_BLOCK_RE.sub(replace_block, content)

    if new_content == content:
        return 'UNCHANGED'

    open(xml_path, 'w', encoding='utf-8').write(new_content)
    return 'OK'


# ──────────────────────────────────────────────
# main
# ──────────────────────────────────────────────

def main():
    # DDL 전체 파싱
    schema_db = {}
    for folder in FOLDER_MAP:
        ddl_dir = os.path.join(DDL_ROOT, folder)
        if not os.path.isdir(ddl_dir): continue
        for sql_path in glob.glob(os.path.join(ddl_dir, '*.sql')):
            try:
                tn, s = parse_ddl(open(sql_path, encoding='utf-8').read())
                if tn and s:
                    schema_db[tn] = s
            except Exception as e:
                print(f"[DDL-ERR] {os.path.basename(sql_path)}: {e}")

    print(f"Schema DB: {len(schema_db)} tables\n")

    counts = {}
    for xml_path in sorted(glob.glob(os.path.join(MAPPER_ROOT, '**', '*.xml'), recursive=True)):
        if 'AutoRest' in xml_path: continue
        r = enhance_mapper(xml_path, schema_db)
        counts[r] = counts.get(r, 0) + 1
        name = os.path.basename(xml_path)
        if r == 'OK':
            print(f"[OK]       {name}")
        elif r == 'EXISTS':
            print(f"[SKIP]     {name}  ← already has JOIN")
        elif r == 'NO-JOINS':
            print(f"[NO-JOIN]  {name}")
        else:
            print(f"[{r}] {name}")

    print(f"\n완료: {counts}")


if __name__ == '__main__':
    main()
