#!/usr/bin/env python3
"""
Auto-generate MyBatis Mapper XML files from DDL SQL files.
Skips files that already exist.
"""

import os, re, glob

DDL_ROOT    = r"c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_doc"
MAPPER_ROOT = r"c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi\src\main\resources\mapper"
SCHEMA      = "shopjoy_2604"

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

# Domain prefix → java package domain
DOMAIN_PREFIX = {
    'cm': 'cm', 'cmh': 'cm',
    'dp': 'dp',
    'mb': 'mb', 'mbh': 'mb',
    'od': 'od', 'odh': 'od',
    'pd': 'pd', 'pdh': 'pd',
    'pm': 'pm', 'pmh': 'pm',
    'st': 'st',
    'sy': 'sy', 'syh': 'sy',
}


def snake_to_pascal(s):
    return ''.join(w.capitalize() for w in s.split('_'))


def snake_to_camel(s):
    parts = s.split('_')
    return parts[0] + ''.join(w.capitalize() for w in parts[1:])


def get_domain(table_name):
    prefix = table_name.split('_')[0]
    return DOMAIN_PREFIX.get(prefix, 'sy')


def is_readonly_table(table_name):
    """Hist / log tables: skip updateSelective."""
    prefix = table_name.split('_')[0]
    return prefix.endswith('h') or 'log' in table_name


def parse_ddl(sql_content):
    """Return (table_name, pk_cols, columns[{name, type}])."""
    ct = re.search(r'CREATE TABLE\s+(?:\w+\.)?\s*(\w+)\s*\(', sql_content, re.IGNORECASE)
    if not ct:
        return None, [], []

    table_name = ct.group(1)

    # Extract body between outer parens
    depth, body_start, body_end = 0, -1, -1
    for i in range(ct.start(), len(sql_content)):
        ch = sql_content[i]
        if ch == '(':
            if depth == 0:
                body_start = i + 1
            depth += 1
        elif ch == ')':
            depth -= 1
            if depth == 0:
                body_end = i
                break

    if body_start == -1 or body_end == -1:
        return table_name, [], []

    body = sql_content[body_start:body_end]

    # PK
    pk_m = re.search(r'PRIMARY KEY\s*\(([^)]+)\)', body, re.IGNORECASE)
    pk_cols = [c.strip() for c in pk_m.group(1).split(',')] if pk_m else []

    # Columns
    columns = []
    for line in body.split('\n'):
        line = re.sub(r'--.*$', '', line).strip().rstrip(',').strip()
        if not line:
            continue
        first = line.split()[0].upper() if line.split() else ''
        if first in ('PRIMARY', 'UNIQUE', 'FOREIGN', 'CHECK', 'CONSTRAINT', 'INDEX'):
            continue
        m = re.match(r'(\w+)\s+(\S+)', line)
        if not m:
            continue
        columns.append({'name': m.group(1), 'type': m.group(2).rstrip(',')})

    return table_name, pk_cols, columns


def get_alias(table_name):
    parts = table_name.split('_')
    # Use first letter of last meaningful segment
    last = parts[-1] if parts else 't'
    return last[0] if last else 't'


def get_order_col(columns, alias):
    priority = ['reg_date', 'order_date', 'join_date', 'issue_date',
                'send_date', 'alarm_send_date', 'settle_ym', 'sort_no']
    col_names = [c['name'] for c in columns]
    for p in priority:
        if p in col_names:
            direction = 'ASC' if p == 'sort_no' else 'DESC'
            return f"{alias}.{p} {direction}"
    return "1"


def build_cond(cond_id, alias, columns, pk_cols):
    col_names = [c['name'] for c in columns]
    conds = []

    if 'site_id' in col_names:
        conds.append(f"            <if test=\"p.siteId != null and p.siteId != ''\">AND {alias}.site_id = #{{p.siteId}}</if>")

    if 'vendor_id' in col_names:
        conds.append(f"            <if test=\"p.vendorId != null and p.vendorId != ''\">AND {alias}.vendor_id = #{{p.vendorId}}</if>")

    # first *_status_cd
    for c in columns:
        if c['name'].endswith('_status_cd') and not c['name'].endswith('_before'):
            conds.append(f"            <if test=\"p.status != null and p.status != ''\">AND {alias}.{c['name']} = #{{p.status}}</if>")
            break

    # first *_type_cd
    for c in columns:
        if c['name'].endswith('_type_cd'):
            conds.append(f"            <if test=\"p.typeCd != null and p.typeCd != ''\">AND {alias}.{c['name']} = #{{p.typeCd}}</if>")
            break

    # keyword: first *_nm or *_title column (max 2)
    kw_cols = [c['name'] for c in columns
               if c['name'] not in pk_cols
               and any(c['name'].endswith(s) for s in ('_nm', '_title', '_name'))][:2]
    if kw_cols:
        or_parts = '\n                  OR '.join(
            f"{alias}.{col} ILIKE '%' || #{{p.kw}} || '%'" for col in kw_cols)
        conds.append(
            f"            <if test=\"p.kw != null and p.kw != ''\">\n"
            f"                AND ({or_parts})\n"
            f"            </if>")

    # date range: first date column
    date_col = next((c['name'] for c in columns
                     if c['name'] in ('reg_date', 'order_date', 'join_date',
                                      'issue_date', 'send_date', 'alarm_send_date')), None)
    if date_col:
        conds.append(f"            <if test=\"p.dateStart != null and p.dateStart != ''\">AND {alias}.{date_col} &gt;= #{{p.dateStart}}::DATE</if>")
        conds.append(f"            <if test=\"p.dateEnd   != null and p.dateEnd   != ''\">AND {alias}.{date_col} &lt;  (#{{p.dateEnd}}::DATE + INTERVAL '1 day')</if>")

    body = '\n'.join(conds) if conds else "            <!-- 조건 없음 -->"
    return f"    <sql id=\"{cond_id}\">\n        <where>\n{body}\n        </where>\n    </sql>"


def build_update(table_name, alias, pk_cols, columns):
    skip = set(pk_cols) | {'reg_by', 'reg_date'}
    upd_cols = [c for c in columns if c['name'] not in skip]
    if not upd_cols:
        return ""

    pk_col   = pk_cols[0]
    pk_camel = snake_to_camel(pk_col)
    domain   = get_domain(table_name)
    pkg      = f"com.shopjoy.ecadminapi.domain.{domain}.entity.{snake_to_pascal(table_name)}"

    set_lines = '\n'.join(
        f"            <if test=\"{snake_to_camel(c['name'])} != null\">{c['name']} = #{{{snake_to_camel(c['name'])}}},</if>"
        for c in upd_cols)

    return (f"    <update id=\"updateSelective\" parameterType=\"{pkg}\">\n"
            f"        UPDATE {SCHEMA}.{table_name}\n"
            f"        <set>\n{set_lines}\n        </set>\n"
            f"        WHERE {pk_col} = #{{{pk_camel}}}\n"
            f"    </update>")


def generate(table_name, pk_cols, columns, domain):
    alias    = get_alias(table_name)
    cond_id  = snake_to_camel(table_name) + 'Cond'
    dto_cls  = f"com.shopjoy.ecadminapi.domain.{domain}.dto.{snake_to_pascal(table_name)}Dto"
    ns       = f"com.shopjoy.ecadminapi.mapper.{domain}.{snake_to_pascal(table_name)}Mapper"
    order_by = get_order_col(columns, alias)
    pk_col   = pk_cols[0] if pk_cols else None
    pk_camel = snake_to_camel(pk_col) if pk_col else 'id'

    cond_sql = build_cond(cond_id, alias, columns, pk_cols)

    select_by_id = (
        f"    <select id=\"selectById\" resultType=\"{dto_cls}\">\n"
        f"        SELECT {alias}.*\n"
        f"        FROM {SCHEMA}.{table_name} {alias}\n"
        f"        WHERE {alias}.{pk_col} = #{{id}}\n"
        f"    </select>" if pk_col else
        f"    <!-- selectById: PK 미정 -->"
    )

    select_list = (
        f"    <select id=\"selectList\" resultType=\"{dto_cls}\">\n"
        f"        SELECT {alias}.*\n"
        f"        FROM {SCHEMA}.{table_name} {alias}\n"
        f"            <include refid=\"{cond_id}\"/>\n"
        f"        ORDER BY {order_by}\n"
        f"    </select>"
    )

    select_page_list = (
        f"    <select id=\"selectPageList\" resultType=\"{dto_cls}\">\n"
        f"        SELECT {alias}.*\n"
        f"        FROM {SCHEMA}.{table_name} {alias}\n"
        f"            <include refid=\"{cond_id}\"/>\n"
        f"        ORDER BY {order_by}\n"
        f"        LIMIT #{{p.limit}} OFFSET #{{p.offset}}\n"
        f"    </select>"
    )

    select_page_count = (
        f"    <select id=\"selectPageCount\" resultType=\"long\">\n"
        f"        SELECT COUNT(*)\n"
        f"        FROM {SCHEMA}.{table_name} {alias}\n"
        f"            <include refid=\"{cond_id}\"/>\n"
        f"    </select>"
    )

    sections = [
        '<?xml version="1.0" encoding="UTF-8" ?>',
        '<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"',
        '        "http://mybatis.org/dtd/mybatis-3-mapper.dtd">',
        '',
        f'<mapper namespace="{ns}">',
        '',
        cond_sql,
        '',
        select_by_id,
        '',
        select_list,
        '',
        select_page_list,
        '',
        select_page_count,
        '',
    ]

    if not is_readonly_table(table_name):
        upd = build_update(table_name, alias, pk_cols, columns)
        if upd:
            sections.append(upd)
            sections.append('')

    sections.append('</mapper>')
    sections.append('')

    return '\n'.join(sections)


def main():
    created = skipped = errors = 0

    for folder, domain in FOLDER_MAP.items():
        ddl_dir = os.path.join(DDL_ROOT, folder)
        if not os.path.isdir(ddl_dir):
            print(f"[SKIP-DIR] {ddl_dir}")
            continue

        mapper_dir = os.path.join(MAPPER_ROOT, domain)
        os.makedirs(mapper_dir, exist_ok=True)

        for sql_path in sorted(glob.glob(os.path.join(ddl_dir, '*.sql'))):
            try:
                table_name, pk_cols, columns = parse_ddl(
                    open(sql_path, encoding='utf-8').read())
            except Exception as e:
                print(f"[ERR-PARSE] {os.path.basename(sql_path)}: {e}")
                errors += 1
                continue

            if not table_name:
                print(f"[SKIP-NOTBL] {os.path.basename(sql_path)}")
                continue

            out = os.path.join(mapper_dir, f"{snake_to_pascal(table_name)}Mapper.xml")
            if os.path.exists(out):
                print(f"[EXISTS] {os.path.basename(out)}")
                skipped += 1
                continue

            try:
                content = generate(table_name, pk_cols, columns, domain)
                with open(out, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"[OK] {os.path.basename(out)}")
                created += 1
            except Exception as e:
                print(f"[ERR-GEN] {table_name}: {e}")
                errors += 1

    print(f"\nDone.  created={created}  skipped={skipped}  errors={errors}")


if __name__ == "__main__":
    main()
