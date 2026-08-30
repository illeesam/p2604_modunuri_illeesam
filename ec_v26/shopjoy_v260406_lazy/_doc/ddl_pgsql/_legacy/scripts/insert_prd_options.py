import psycopg2
from datetime import datetime
import random

random.seed(99)

conn = psycopg2.connect(
    host='illeesam.synology.me', port=17632, dbname='postgres',
    user='postgres', password='postgresilleesam', options='-c search_path=shopjoy_2604'
)
cur = conn.cursor()

site_id = '2604010000000001'
now = datetime.now()
reg_by = 'system'

# 현재 최대 ID 확인
cur.execute("SELECT MAX(CAST(REPLACE(opt_id,'OG','') AS INT)) FROM pd_prod_opt WHERE opt_id LIKE 'OG%'")
max_opt = cur.fetchone()[0] or 0
cur.execute("SELECT MAX(CAST(REPLACE(opt_item_id,'OI','') AS INT)) FROM pd_prod_opt_item WHERE opt_item_id LIKE 'OI%'")
max_oi = cur.fetchone()[0] or 0
cur.execute("SELECT MAX(CAST(REPLACE(sku_id,'SK','') AS INT)) FROM pd_prod_sku WHERE sku_id LIKE 'SK%' AND sku_id NOT LIKE 'SKU%'")
max_sk = cur.fetchone()[0] or 0

print(f'Max: OG{max_opt:06d}, OI{max_oi:06d}, SK{max_sk:06d}')

opt_seq = max_opt
oi_seq = max_oi
sk_seq = max_sk

# PRD 상품 옵션 정의
PRD_OPTIONS = {
    'PRD0000000000001': [
        ('사이즈', 'SIZE', [('260', '260', 0, 8), ('265', '265', 0, 12), ('270', '270', 0, 15), ('275', '275', 1000, 10), ('280', '280', 2000, 5)]),
        ('색상', 'COLOR', [('블랙', '#000000', 0, None), ('화이트', '#ffffff', 0, None), ('그레이', '#808080', 0, None)]),
    ],
    'PRD0000000000002': [
        ('사이즈', 'SIZE', [('255', '255', 0, 10), ('260', '260', 0, 15), ('265', '265', 0, 12), ('270', '270', 1000, 8), ('275', '275', 2000, 4)]),
        ('색상', 'COLOR', [('블랙', '#000000', 0, None), ('화이트', '#ffffff', 0, None)]),
    ],
    'PRD0000000000003': [
        ('사이즈', 'SIZE', [('250', '250', 0, 6), ('255', '255', 0, 10), ('260', '260', 0, 14), ('265', '265', 0, 12), ('270', '270', 1000, 8), ('275', '275', 2000, 3)]),
        ('색상', 'COLOR', [('블랙', '#1a1a1a', 0, None), ('화이트', '#f5f5f5', 0, None), ('네이비', '#1e3a5f', 0, None)]),
    ],
    'PRD0000000000004': [
        ('색상', 'COLOR', [('블랙', '#1a1a1a', 0, None), ('화이트', '#f5f5f5', 0, None), ('네이비', '#1e3a5f', 0, None)]),
        ('사이즈', 'SIZE', [('S', 'S', 0, None), ('M', 'M', 0, None), ('L', 'L', 1000, None), ('XL', 'XL', 2000, None)]),
    ],
    'PRD0000000000005': [
        ('색상', 'COLOR', [('블랙', '#1a1a1a', 0, None), ('네이비', '#1e3a5f', 0, None), ('다크그레이', '#444444', 0, None)]),
        ('사이즈', 'SIZE', [('S', 'S', 0, None), ('M', 'M', 0, None), ('L', 'L', 1000, None), ('XL', 'XL', 2000, None)]),
    ],
    'PRD0000000000006': [
        ('색상', 'COLOR', [('팬텀블랙', '#1a1a1a', 0, None), ('크림', '#f5f0eb', 0, None), ('바이올렛', '#7b68ee', 0, None)]),
        ('용량', 'CUSTOM', [('256GB', '256', 0, None), ('512GB', '512', 100000, None)]),
    ],
    'PRD0000000000007': [
        ('색상', 'COLOR', [('블랙', '#1a1a1a', 0, 5), ('실버', '#c0c0c0', 0, 3)]),
    ],
    'PRD0000000000008': [
        ('색상', 'COLOR', [('실버', '#c0c0c0', 0, None), ('퍼플', '#7b68ee', 0, None), ('핑크', '#ffb6c1', 0, None), ('블루', '#4169e1', 0, None)]),
        ('메모리', 'CUSTOM', [('16GB', '16GB', 0, None), ('24GB', '24GB', 200000, None), ('32GB', '32GB', 400000, None)]),
    ],
    'PRD0000000000009': [
        ('사이즈', 'SIZE', [('S', 'S', 0, 8), ('M', 'M', 0, 12), ('L', 'L', 0, 10), ('XL', 'XL', 1000, 5)]),
        ('색상', 'COLOR', [('블랙', '#1a1a1a', 0, None), ('화이트', '#f5f5f5', 0, None), ('레드', '#cc0000', 0, None)]),
    ],
    'PRD0000000000010': [
        ('색상', 'COLOR', [('블랙3팩', '#1a1a1a', 0, 20), ('화이트3팩', '#f5f5f5', 0, 18), ('믹스3팩', '#cccccc', 0, 15)]),
    ],
    'PRD0000000000011': [
        ('사이즈', 'SIZE', [('255', '255', 0, 5), ('260', '260', 0, 8), ('265', '265', 0, 10), ('270', '270', 0, 12), ('275', '275', 1000, 7), ('280', '280', 2000, 4)]),
        ('색상', 'COLOR', [('블랙', '#1a1a1a', 0, None), ('화이트', '#f5f5f5', 0, None)]),
    ],
    'PRD0000000000012': [
        ('색상', 'COLOR', [('그라파이트', '#444444', 0, None), ('실버', '#c0c0c0', 0, None)]),
        ('저장용량', 'CUSTOM', [('256GB', '256GB', 0, None), ('512GB', '512GB', 200000, None), ('1TB', '1TB', 400000, None)]),
    ],
}

COLOR_MULT = {
    '블랙': 1.5, '화이트': 1.2, '네이비': 1.0, '그레이': 0.9, '크림': 0.7,
    '실버': 0.8, '그라파이트': 0.7, '핑크': 0.5, '블루': 0.8, '퍼플': 0.4,
    '바이올렛': 0.4, '레드': 0.5, '다크그레이': 0.8, '팬텀블랙': 1.2,
    '믹스3팩': 0.8, '블랙3팩': 1.3, '화이트3팩': 1.0,
}
SIZE_MULT = {
    'S': 0.7, 'M': 1.4, 'L': 1.1, 'XL': 0.6,
    '250': 0.5, '255': 0.8, '260': 1.2, '265': 1.3, '270': 1.1, '275': 0.7, '280': 0.4,
}

opts_ins = []
items_ins = []
skus_ins = []

for prod_id, opt_groups in PRD_OPTIONS.items():
    group_data = []

    for level_idx, (grp_nm, grp_type, items) in enumerate(opt_groups):
        opt_seq += 1
        opt_id = f'OG{opt_seq:06d}'
        opts_ins.append((opt_id, site_id, prod_id, grp_nm, level_idx + 1, grp_type, 'SELECT', level_idx + 1, reg_by, now, reg_by, now))

        item_ids = []
        for sort_idx, (opt_nm, opt_val, ap, fixed_stock) in enumerate(items):
            oi_seq += 1
            oi_id = f'OI{oi_seq:06d}'
            item_ids.append(oi_id)
            items_ins.append((oi_id, site_id, opt_id, grp_type, opt_nm, opt_val, None, None, sort_idx + 1, 'Y', reg_by, now, reg_by, now))

        group_data.append((grp_nm, grp_type, items, item_ids))

    if len(group_data) == 1:
        grp_nm, grp_type, items, ids = group_data[0]
        for i, oi_id in enumerate(ids):
            opt_nm, opt_val, add_price, fixed_stock = items[i]
            stock = fixed_stock if fixed_stock is not None else random.randint(5, 25)
            sk_seq += 1
            skus_ins.append((f'SK{sk_seq:06d}', site_id, prod_id, oi_id, None,
                             f'{prod_id[-4:]}-{opt_nm}', add_price, stock, 'Y', reg_by, now, reg_by, now))
    elif len(group_data) == 2:
        grp_nm1, type1, items1, ids1 = group_data[0]
        grp_nm2, type2, items2, ids2 = group_data[1]
        for i, oi1 in enumerate(ids1):
            nm1, val1, ap1, _ = items1[i]
            for j, oi2 in enumerate(ids2):
                nm2, val2, ap2, _ = items2[j]
                add_price = ap1 + ap2
                base = random.randint(8, 30)
                m1 = COLOR_MULT.get(nm1, 1.0) if type1 == 'COLOR' else SIZE_MULT.get(nm1, 1.0)
                m2 = COLOR_MULT.get(nm2, 1.0) if type2 == 'COLOR' else SIZE_MULT.get(nm2, 1.0)
                stock = max(0, round(base * m1 * m2))
                sk_seq += 1
                skus_ins.append((f'SK{sk_seq:06d}', site_id, prod_id, oi1, oi2,
                                 f'{prod_id[-4:]}-{nm1}-{nm2}', add_price, stock, 'Y', reg_by, now, reg_by, now))

# 기존 PRD 데이터 삭제 후 재삽입
cur.execute("DELETE FROM pd_prod_sku WHERE prod_id LIKE 'PRD%'")
cur.execute("DELETE FROM pd_prod_opt_item WHERE opt_id IN (SELECT opt_id FROM pd_prod_opt WHERE prod_id LIKE 'PRD%')")
cur.execute("DELETE FROM pd_prod_opt WHERE prod_id LIKE 'PRD%'")

cur.executemany(
    'INSERT INTO pd_prod_opt (opt_id, site_id, prod_id, opt_grp_nm, opt_level, opt_type_cd, opt_input_type_cd, sort_ord, reg_by, reg_date, upd_by, upd_date) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
    opts_ins
)
cur.executemany(
    'INSERT INTO pd_prod_opt_item (opt_item_id, site_id, opt_id, opt_type_cd, opt_nm, opt_val, opt_val_code_id, parent_opt_item_id, sort_ord, use_yn, reg_by, reg_date, upd_by, upd_date) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
    items_ins
)
cur.executemany(
    'INSERT INTO pd_prod_sku (sku_id, site_id, prod_id, opt_item_id_1, opt_item_id_2, sku_code, add_price, prod_opt_stock, use_yn, reg_by, reg_date, upd_by, upd_date) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)',
    skus_ins
)

conn.commit()
print(f'Inserted: {len(opts_ins)} opts, {len(items_ins)} opt_items, {len(skus_ins)} SKUs')

cur.execute('''
    SELECT p.prod_nm, COUNT(s.sku_id) as sku_cnt, MIN(s.add_price), MAX(s.add_price), SUM(s.prod_opt_stock) as total_stock
    FROM pd_prod p JOIN pd_prod_sku s ON s.prod_id = p.prod_id
    WHERE p.prod_id LIKE 'PRD%'
    GROUP BY p.prod_id, p.prod_nm ORDER BY p.prod_id
''')
print('\nPRD SKU 요약:')
for r in cur.fetchall():
    print(r)

conn.close()
