import psycopg2

conn = psycopg2.connect(
    host='illeesam.synology.me',
    port=17632,
    dbname='postgres',
    user='postgres',
    password='postgresilleesam',
    options='-c search_path=shopjoy_2604'
)
conn.autocommit = False
cur = conn.cursor()

def ins(biz_cd, parent_id, label, sort):
    cur.execute(
        "INSERT INTO sy_path (biz_cd, parent_path_id, path_label, sort_ord, use_yn, reg_by, reg_date) VALUES (%s, %s, %s, %s, 'Y', 'admin', NOW()) RETURNING path_id",
        (biz_cd, parent_id, label, sort)
    )
    return cur.fetchone()[0]

try:
    cur.execute("TRUNCATE TABLE sy_path RESTART IDENTITY CASCADE")
    print("TRUNCATE OK")

    # [1] ec_disp_ui
    r = ins('ec_disp_ui', None, 'ec_disp_ui', 1)
    fo = ins('ec_disp_ui', r, 'FO', 1)
    bo = ins('ec_disp_ui', r, 'BO', 2)
    mo = ins('ec_disp_ui', r, 'MOBILE', 3)
    ins('ec_disp_ui', fo, 'Main', 1)
    ins('ec_disp_ui', fo, 'Product', 2)
    ins('ec_disp_ui', fo, 'Event', 3)
    ins('ec_disp_ui', bo, 'Dashboard', 1)
    ins('ec_disp_ui', mo, 'MMain', 1)

    # [2] ec_disp_area
    r = ins('ec_disp_area', None, 'ec_disp_area', 2)
    fo = ins('ec_disp_area', r, 'FO', 1)
    bo = ins('ec_disp_area', r, 'BO', 2)
    mo = ins('ec_disp_area', r, 'MOBILE', 3)
    ins('ec_disp_area', fo, 'Main', 1)
    ins('ec_disp_area', fo, 'Product', 2)
    ins('ec_disp_area', fo, 'Banner', 3)
    ins('ec_disp_area', bo, 'Dashboard', 1)
    ins('ec_disp_area', mo, 'MMain', 1)

    # [3] ec_disp_panel
    r = ins('ec_disp_panel', None, 'ec_disp_panel', 3)
    fo = ins('ec_disp_panel', r, 'FO', 1)
    bo = ins('ec_disp_panel', r, 'BO', 2)
    mo = ins('ec_disp_panel', r, 'MOBILE', 3)
    ins('ec_disp_panel', fo, 'Main', 1)
    ins('ec_disp_panel', fo, 'Product', 2)
    ins('ec_disp_panel', fo, 'Banner', 3)
    ins('ec_disp_panel', bo, 'Dashboard', 1)
    ins('ec_disp_panel', mo, 'MMain', 1)
    ins('ec_disp_panel', mo, 'MBanner', 2)

    # [4] ec_disp_widget
    r = ins('ec_disp_widget', None, 'ec_disp_widget', 4)
    fo = ins('ec_disp_widget', r, 'FO', 1)
    bo = ins('ec_disp_widget', r, 'BO', 2)
    mo = ins('ec_disp_widget', r, 'MOBILE', 3)
    ins('ec_disp_widget', fo, 'PC', 1)
    ins('ec_disp_widget', fo, 'Mobile', 2)
    ins('ec_disp_widget', fo, 'Banner', 3)
    ins('ec_disp_widget', fo, 'Product', 4)
    ins('ec_disp_widget', bo, 'Admin', 1)
    ins('ec_disp_widget', mo, 'MPC', 1)
    ins('ec_disp_widget', mo, 'MMobile', 2)

    # [5] ec_disp_widget_lib
    r = ins('ec_disp_widget_lib', None, 'ec_disp_widget_lib', 5)
    g1 = ins('ec_disp_widget_lib', r, 'Common', 1)
    g2 = ins('ec_disp_widget_lib', r, 'Product', 2)
    g3 = ins('ec_disp_widget_lib', r, 'Promotion', 3)
    ins('ec_disp_widget_lib', r, 'Layout', 4)
    ins('ec_disp_widget_lib', g1, 'Banner', 1)
    ins('ec_disp_widget_lib', g1, 'Text', 2)
    ins('ec_disp_widget_lib', g2, 'Slider', 1)
    ins('ec_disp_widget_lib', g2, 'Grid', 2)
    ins('ec_disp_widget_lib', g3, 'Coupon', 1)
    ins('ec_disp_widget_lib', g3, 'Event', 2)

    # [6] sy_brand
    r = ins('sy_brand', None, 'sy_brand', 6)
    f = ins('sy_brand', r, 'Fashion', 1)
    lf = ins('sy_brand', r, 'Life', 2)
    fd = ins('sy_brand', r, 'Food', 3)
    ins('sy_brand', r, 'Beauty', 4)
    ins('sy_brand', r, 'Sports', 5)
    ins('sy_brand', f, 'Clothing', 1)
    ins('sy_brand', f, 'Accessories', 2)
    ins('sy_brand', lf, 'Interior', 1)
    ins('sy_brand', lf, 'Kitchen', 2)
    ins('sy_brand', fd, 'Health', 1)
    ins('sy_brand', fd, 'Fresh', 2)

    # [7] sy_code_grp
    r = ins('sy_code_grp', None, 'sy_code_grp', 7)
    s = ins('sy_code_grp', r, 'System', 1)
    c = ins('sy_code_grp', r, 'Commerce', 2)
    d = ins('sy_code_grp', r, 'Display', 3)
    p = ins('sy_code_grp', r, 'Settle', 4)
    ins('sy_code_grp', s, 'User', 1)
    ins('sy_code_grp', s, 'Auth', 2)
    ins('sy_code_grp', c, 'Order', 1)
    ins('sy_code_grp', c, 'Product', 2)
    ins('sy_code_grp', c, 'Delivery', 3)
    ins('sy_code_grp', c, 'CouponCash', 4)
    ins('sy_code_grp', d, 'UIArea', 1)
    ins('sy_code_grp', p, 'Settlement', 1)

    # [8] sy_vendor
    r = ins('sy_vendor', None, 'sy_vendor', 8)
    f = ins('sy_vendor', r, 'Fashion', 1)
    lf = ins('sy_vendor', r, 'Life', 2)
    fd = ins('sy_vendor', r, 'Food', 3)
    ins('sy_vendor', r, 'Beauty', 4)
    ins('sy_vendor', r, 'Sports', 5)
    ins('sy_vendor', f, 'Clothing', 1)
    ins('sy_vendor', f, 'Accessories', 2)
    ins('sy_vendor', lf, 'Interior', 1)
    ins('sy_vendor', lf, 'Kitchen', 2)
    ins('sy_vendor', fd, 'Health', 1)
    ins('sy_vendor', fd, 'Fresh', 2)

    # [9] sy_template
    r = ins('sy_template', None, 'sy_template', 9)
    e = ins('sy_template', r, 'Email', 1)
    sms = ins('sy_template', r, 'SMS', 2)
    k = ins('sy_template', r, 'Kakao', 3)
    ins('sy_template', r, 'Push', 4)
    ins('sy_template', e, 'Signup', 1)
    ins('sy_template', e, 'Order', 2)
    ins('sy_template', e, 'Delivery', 3)
    ins('sy_template', e, 'Claim', 4)
    ins('sy_template', sms, 'Auth', 1)
    ins('sy_template', sms, 'Order', 2)
    ins('sy_template', k, 'Alimtalk', 1)
    ins('sy_template', k, 'Friendtalk', 2)

    # [10] sy_alarm
    r = ins('sy_alarm', None, 'sy_alarm', 10)
    m = ins('sy_alarm', r, 'Member', 1)
    a = ins('sy_alarm', r, 'Admin', 2)
    v = ins('sy_alarm', r, 'Vendor', 3)
    ins('sy_alarm', m, 'Order', 1)
    ins('sy_alarm', m, 'Coupon', 2)
    ins('sy_alarm', a, 'OrderRecv', 1)
    ins('sy_alarm', a, 'Claim', 2)
    ins('sy_alarm', v, 'Settle', 1)
    ins('sy_alarm', v, 'Product', 2)

    # [11] sy_batch
    r = ins('sy_batch', None, 'sy_batch', 11)
    d1 = ins('sy_batch', r, 'Daily', 1)
    d2 = ins('sy_batch', r, 'Weekly', 2)
    d3 = ins('sy_batch', r, 'Monthly', 3)
    d4 = ins('sy_batch', r, 'Realtime', 4)
    ins('sy_batch', d1, 'Settle', 1)
    ins('sy_batch', d1, 'Order', 2)
    ins('sy_batch', d1, 'Delivery', 3)
    ins('sy_batch', d2, 'Stats', 1)
    ins('sy_batch', d3, 'SettleClose', 1)
    ins('sy_batch', d3, 'MemberGrade', 2)
    ins('sy_batch', d4, 'Alarm', 1)

    # [12] sy_role
    r = ins('sy_role', None, 'sy_role', 12)
    a = ins('sy_role', r, 'Admin', 1)
    b = ins('sy_role', r, 'Vendor', 2)
    s = ins('sy_role', r, 'System', 3)
    ins('sy_role', a, 'FullAdmin', 1)
    ins('sy_role', a, 'ProductMgr', 2)
    ins('sy_role', a, 'CSMgr', 3)
    ins('sy_role', b, 'VendorAdmin', 1)
    ins('sy_role', b, 'VendorStaff', 2)
    ins('sy_role', s, 'SuperAdmin', 1)

    # [13] sy_site
    r = ins('sy_site', None, 'sy_site', 13)
    n = ins('sy_site', r, 'Domestic', 1)
    h = ins('sy_site', r, 'Global', 2)
    m = ins('sy_site', r, 'Mobile', 3)
    ins('sy_site', n, 'PC', 1)
    ins('sy_site', n, 'App', 2)
    ins('sy_site', h, 'English', 1)
    ins('sy_site', m, 'iOS', 1)
    ins('sy_site', m, 'Android', 2)

    # [14] sy_biz
    r = ins('sy_biz', None, 'sy_biz', 14)
    c = ins('sy_biz', r, 'Commerce', 1)
    d = ins('sy_biz', r, 'Display', 2)
    p = ins('sy_biz', r, 'Settle', 3)
    s = ins('sy_biz', r, 'System', 4)
    ins('sy_biz', c, 'Order', 1)
    ins('sy_biz', c, 'Product', 2)
    ins('sy_biz', c, 'Member', 3)
    ins('sy_biz', d, 'UIManage', 1)
    ins('sy_biz', p, 'Settlement', 1)
    ins('sy_biz', s, 'CommonCode', 1)

    # [15] sy_bbm
    r = ins('sy_bbm', None, 'sy_bbm', 15)
    g1 = ins('sy_bbm', r, 'Notice', 1)
    g2 = ins('sy_bbm', r, 'WorkMemo', 2)
    g3 = ins('sy_bbm', r, 'Issue', 3)
    ins('sy_bbm', g1, 'AllNotice', 1)
    ins('sy_bbm', g1, 'VendorNotice', 2)
    ins('sy_bbm', g2, 'Dev', 1)
    ins('sy_bbm', g2, 'Ops', 2)
    ins('sy_bbm', g3, 'Urgent', 1)
    ins('sy_bbm', g3, 'General', 2)

    conn.commit()

    cur.execute("SELECT biz_cd, COUNT(*) FROM sy_path GROUP BY biz_cd ORDER BY biz_cd")
    rows = cur.fetchall()
    total = 0
    print("\n=== biz_cd 별 건수 ===")
    for row in rows:
        print(f"  {row[0]}: {row[1]}")
        total += row[1]
    print(f"  TOTAL: {total}")

    cur.execute("SELECT path_id, biz_cd, path_label FROM sy_path WHERE parent_path_id IS NULL ORDER BY sort_ord")
    print("\n=== 루트(1레벨) - biz_cd == path_label ===")
    for row in cur.fetchall():
        match = "OK" if row[1] == row[2] else "MISMATCH"
        print(f"  id={row[0]} biz_cd={row[1]} label={row[2]} [{match}]")

except Exception as e:
    conn.rollback()
    import traceback; traceback.print_exc()
    print(f"ERROR: {e}")
finally:
    cur.close()
    conn.close()
