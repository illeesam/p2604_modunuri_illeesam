#!/usr/bin/env python3
"""Generate JPA Entity classes from PostgreSQL DDL files."""

import os, re, glob

BASE_DDL = r"c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_doc"
BASE_JAVA = r"c:\_pjt_github\p2604_modunuri_illeesam\ec_v26\shopjoy_v260406\_apps\EcAdminApi\src\main\java\com\shopjoy\ecadminapi\domain"

# DDL folder → Java domain package
FOLDER_PKG = {
    "ddlPgsql-ec-cm": "cm",
    "ddlPgsql-ec-dp": "dp",
    "ddlPgsql-ec-mb": "mb",
    "ddlPgsql-ec-od": "od",
    "ddlPgsql-ec-pd": "pd",
    "ddlPgsql-ec-pm": "pm",
    "ddlPgsql-ec-st": "st",
    "ddlPgsql-sy":    "sy",
}

# SQL type → (java type, import or None)
def sql_to_java(sql_type: str):
    t = sql_type.upper().strip()
    if t.startswith("VARCHAR") or t.startswith("CHAR") or t == "TEXT":
        return "String", None
    if t == "BIGINT":
        return "Long", None
    if t in ("INTEGER", "INT"):
        return "Integer", None
    if t == "SMALLINT":
        return "Integer", None
    if t.startswith("DECIMAL") or t.startswith("NUMERIC"):
        return "BigDecimal", "java.math.BigDecimal"
    if t == "DATE":
        return "LocalDate", "java.time.LocalDate"
    if t == "TIMESTAMP":
        return "LocalDateTime", "java.time.LocalDateTime"
    if t == "BOOLEAN":
        return "Boolean", None
    if t == "JSONB" or t == "JSON":
        return "String", None
    return "String", None

def snake_to_camel(name: str) -> str:
    parts = name.split("_")
    return parts[0] + "".join(p.capitalize() for p in parts[1:])

def snake_to_pascal(name: str) -> str:
    return "".join(p.capitalize() for p in name.split("_"))

def table_to_class(table_nm: str) -> str:
    # cmh_push_log → CmhPushLog, odh_order_status_hist → OdhOrderStatusHist
    return snake_to_pascal(table_nm)

def pkg_from_table(table_nm: str, folder_pkg: str) -> str:
    return folder_pkg

def parse_columns(sql: str):
    """Parse CREATE TABLE DDL and return list of (col_name, java_type, import, nullable, pk, length)"""
    # Extract table name
    m = re.search(r"CREATE TABLE\s+(?:\w+\.)?([\w]+)\s*\(", sql, re.IGNORECASE)
    if not m:
        return None, []
    table_nm = m.group(1)

    # Find primary key(s)
    pk_set = set()
    for pk_m in re.finditer(r"PRIMARY KEY\s*\(([\w\s,]+)\)", sql, re.IGNORECASE):
        for col in pk_m.group(1).split(","):
            pk_set.add(col.strip().lower())

    cols = []
    # Extract content between outer parens of CREATE TABLE (not comment parens)
    ct_match = re.search(r"CREATE TABLE\s+(?:\w+\.)?\w+\s*\(", sql, re.IGNORECASE)
    if not ct_match:
        return None, []
    start = ct_match.end() - 1  # position of opening '('
    depth = 0
    inner_start = start + 1
    inner = None
    for i, ch in enumerate(sql[start:], start):
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                inner = sql[inner_start:i]
                break
    if inner is None:
        return None, []

    # Split into lines, filter constraint/index lines
    lines = [l.strip() for l in inner.split("\n")]
    col_pattern = re.compile(
        r"^([\w]+)\s+(VARCHAR|CHAR|TEXT|BIGINT|INTEGER|INT|SMALLINT|DECIMAL|NUMERIC|DATE|TIMESTAMP|BOOLEAN|JSONB|JSON)(\([^)]*\))?"
        r"(\s+NOT NULL)?(\s+DEFAULT\s+[^\s,]+)?",
        re.IGNORECASE
    )

    seen = set()
    for line in lines:
        line = line.rstrip(",").strip()
        if not line or line.upper().startswith("--"):
            continue
        if re.match(r"(PRIMARY|UNIQUE|CONSTRAINT|CHECK|FOREIGN|INDEX)", line, re.IGNORECASE):
            continue
        m2 = col_pattern.match(line)
        if not m2:
            continue
        col_nm = m2.group(1).lower()
        if col_nm in seen:
            continue
        seen.add(col_nm)

        raw_type = m2.group(2)
        type_args = m2.group(3) or ""
        not_null = bool(m2.group(4))
        is_pk = col_nm in pk_set

        # Determine length for VARCHAR
        length = 255
        if "VARCHAR" in raw_type.upper() or "CHAR" in raw_type.upper():
            lm = re.search(r"\((\d+)\)", type_args)
            if lm:
                length = int(lm.group(1))

        java_type, imp = sql_to_java(raw_type + type_args)
        cols.append({
            "col": col_nm,
            "field": snake_to_camel(col_nm),
            "java_type": java_type,
            "import": imp,
            "nullable": not not_null and not is_pk,
            "is_pk": is_pk,
            "length": length,
            "raw_type": raw_type.upper(),
        })

    return table_nm, cols


def generate_entity(table_nm: str, cols, pkg: str) -> str:
    class_nm = table_to_class(table_nm)
    imports = set()
    imports.add("jakarta.persistence.*")
    imports.add("lombok.Getter")
    imports.add("lombok.Setter")
    imports.add("lombok.NoArgsConstructor")
    imports.add("lombok.AllArgsConstructor")
    imports.add("lombok.Builder")

    for c in cols:
        if c["import"]:
            imports.add(c["import"])

    has_pk = any(c["is_pk"] for c in cols)
    if not has_pk and cols:
        cols[0]["is_pk"] = True  # fallback

    lines = []
    lines.append(f"package com.shopjoy.ecadminapi.domain.{pkg}.entity;")
    lines.append("")
    for imp in sorted(imports):
        lines.append(f"import {imp};")
    lines.append("")
    lines.append("@Entity")
    lines.append(f'@Table(name = "{table_nm}", schema = "shopjoy_2604")')
    lines.append("@Getter @Setter")
    lines.append("@NoArgsConstructor @AllArgsConstructor @Builder")
    lines.append(f"public class {class_nm} {{")
    lines.append("")

    for c in cols:
        col_annots = []
        if c["is_pk"]:
            col_annots.append("    @Id")
        if c["raw_type"] in ("TEXT", "JSONB", "JSON"):
            col_annots.append("    @Lob")
        if c["raw_type"].startswith("VARCHAR") or c["raw_type"].startswith("CHAR"):
            if c["nullable"]:
                col_annots.append(f'    @Column(name = "{c["col"]}", length = {c["length"]})')
            else:
                col_annots.append(f'    @Column(name = "{c["col"]}", length = {c["length"]}, nullable = false)')
        elif c["raw_type"] == "TEXT" or c["raw_type"] in ("JSONB","JSON"):
            col_annots.append(f'    @Column(name = "{c["col"]}", columnDefinition = "TEXT")')
        else:
            if not c["nullable"]:
                col_annots.append(f'    @Column(name = "{c["col"]}", nullable = false)')
            else:
                col_annots.append(f'    @Column(name = "{c["col"]}")')

        for a in col_annots:
            lines.append(a)
        lines.append(f"    private {c['java_type']} {c['field']};")
        lines.append("")

    lines.append("}")
    return "\n".join(lines)


def main():
    created = 0
    skipped = 0

    for folder, pkg in FOLDER_PKG.items():
        ddl_dir = os.path.join(BASE_DDL, folder)
        if not os.path.isdir(ddl_dir):
            print(f"[SKIP] dir not found: {ddl_dir}")
            continue

        sql_files = glob.glob(os.path.join(ddl_dir, "*.sql"))
        for sql_path in sorted(sql_files):
            with open(sql_path, encoding="utf-8") as f:
                sql = f.read()

            table_nm, cols = parse_columns(sql)
            if not table_nm or not cols:
                print(f"[SKIP] no table parsed: {sql_path}")
                skipped += 1
                continue

            entity_code = generate_entity(table_nm, cols, pkg)
            class_nm = table_to_class(table_nm)

            out_dir = os.path.join(BASE_JAVA, pkg, "entity")
            os.makedirs(out_dir, exist_ok=True)
            out_path = os.path.join(out_dir, f"{class_nm}.java")

            with open(out_path, "w", encoding="utf-8") as f:
                f.write(entity_code)

            print(f"[OK] {pkg}/{class_nm}.java  ({len(cols)} fields)")
            created += 1

    print(f"\n=== Done: {created} created, {skipped} skipped ===")


if __name__ == "__main__":
    main()
