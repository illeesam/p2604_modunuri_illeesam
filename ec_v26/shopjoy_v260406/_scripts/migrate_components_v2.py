#!/usr/bin/env python3
import os
import re
import sys

MIGRATION_MAP = {
    'MbMember': {'var': 'members', 'api': '/bo/ec/mb/member/page', 'field': 'list'},
    'MbMemGrade': {'var': 'grades', 'api': '/bo/ec/mb/mem-grade/page', 'field': 'list'},
    'MbMemGroup': {'var': 'groups', 'api': '/bo/ec/mb/mem-group/page', 'field': 'list'},
    'PdProd': {'var': 'products', 'api': '/bo/ec/pd/prod/page', 'field': 'list'},
    'PdCategory': {'var': 'categories', 'api': '/bo/ec/pd/category/page', 'field': 'list'},
    'PdBundle': {'var': 'bundles', 'api': '/bo/ec/pd/bundle/page', 'field': 'list'},
    'PdSet': {'var': 'sets', 'api': '/bo/ec/pd/set/page', 'field': 'list'},
    'PdTag': {'var': 'tags', 'api': '/bo/ec/pd/tag/page', 'field': 'list'},
    'PdReview': {'var': 'reviews', 'api': '/bo/ec/pd/review/page', 'field': 'list'},
    'PdQna': {'var': 'qnas', 'api': '/bo/ec/pd/qna/page', 'field': 'list'},
    'PdRestockNoti': {'var': 'restockNotis', 'api': '/bo/ec/pd/restock-noti/page', 'field': 'list'},
    'OdOrder': {'var': 'orders', 'api': '/bo/ec/od/order/page', 'field': 'list'},
    'OdClaim': {'var': 'claims', 'api': '/bo/ec/od/claim/page', 'field': 'list'},
    'OdDliv': {'var': 'deliveries', 'api': '/bo/ec/od/dliv/page', 'field': 'list'},
    'PmCoupon': {'var': 'coupons', 'api': '/bo/ec/pm/coupon/page', 'field': 'list'},
    'PmCache': {'var': 'caches', 'api': '/bo/ec/pm/cache/page', 'field': 'list'},
    'PmEvent': {'var': 'events', 'api': '/bo/ec/pm/event/page', 'field': 'list'},
    'PmPlan': {'var': 'plans', 'api': '/bo/ec/pm/plan/page', 'field': 'list'},
    'PmDiscnt': {'var': 'discounts', 'api': '/bo/ec/pm/discnt/page', 'field': 'list'},
    'PmSave': {'var': 'saves', 'api': '/bo/ec/pm/save/page', 'field': 'list'},
    'PmGift': {'var': 'gifts', 'api': '/bo/ec/pm/gift/page', 'field': 'list'},
    'PmVoucher': {'var': 'vouchers', 'api': '/bo/ec/pm/voucher/page', 'field': 'list'},
    'DpDispUi': {'var': 'displays', 'api': '/bo/ec/dp/ui/page', 'field': 'list'},
    'DpDispArea': {'var': 'areas', 'api': '/bo/ec/dp/area/page', 'field': 'list'},
    'DpDispPanel': {'var': 'panels', 'api': '/bo/ec/dp/panel/page', 'field': 'list'},
    'DpDispWidget': {'var': 'widgets', 'api': '/bo/ec/dp/widget/page', 'field': 'list'},
    'DpDispWidgetLib': {'var': 'widgetLibs', 'api': '/bo/ec/dp/widget-lib/page', 'field': 'list'},
    'CmChatt': {'var': 'chatts', 'api': '/bo/ec/cm/chatt/page', 'field': 'list'},
    'CmBlog': {'var': 'blogs', 'api': '/bo/ec/cm/blog/page', 'field': 'list'},
    'CmNotice': {'var': 'notices', 'api': '/bo/ec/cm/notice/page', 'field': 'list'},
    'SySite': {'var': 'sites', 'api': '/bo/sy/site/page', 'field': 'list'},
    'SyCode': {'var': 'codes', 'api': '/bo/sy/code/page', 'field': 'list'},
    'SyBrand': {'var': 'brands', 'api': '/bo/sy/brand/page', 'field': 'list'},
    'SyAttach': {'var': 'attachs', 'api': '/bo/sy/attach/page', 'field': 'list'},
    'SyTemplate': {'var': 'templates', 'api': '/bo/sy/template/page', 'field': 'list'},
    'SyVendor': {'var': 'vendors', 'api': '/bo/sy/vendor/page', 'field': 'list'},
    'SyBiz': {'var': 'bizs', 'api': '/bo/sy/biz/page', 'field': 'list'},
    'SyBizUser': {'var': 'bizUsers', 'api': '/bo/sy/biz-user/page', 'field': 'list'},
    'SyDept': {'var': 'depts', 'api': '/bo/sy/dept/page', 'field': 'list'},
    'SyMenu': {'var': 'menus', 'api': '/bo/sy/menu/page', 'field': 'list'},
    'SyRole': {'var': 'roles', 'api': '/bo/sy/role/page', 'field': 'list'},
    'SyUser': {'var': 'users', 'api': '/bo/sy/user/page', 'field': 'list'},
    'SyBatch': {'var': 'batches', 'api': '/bo/sy/batch/page', 'field': 'list'},
    'SyAlarm': {'var': 'alarms', 'api': '/bo/sy/alarm/page', 'field': 'list'},
    'SyBbm': {'var': 'bbms', 'api': '/bo/sy/bbm/page', 'field': 'list'},
    'SyBbs': {'var': 'bbss', 'api': '/bo/sy/bbs/page', 'field': 'list'},
    'SyContact': {'var': 'contacts', 'api': '/bo/sy/contact/page', 'field': 'list'},
    'MbCustInfo': {'var': 'custInfos', 'api': '/bo/ec/mb/cust-info/page', 'field': 'list'},
}

def extract_prefix(filename):
    """MbMemberMng.js -> MbMember"""
    match = re.match(r'([A-Z][a-z][A-Z][a-z\w]+?)(?:Mng|Dtl|Hist)\.js$', filename)
    return match.group(1) if match else None

def migrate_file(filepath):
    """한 파일을 마이그레이션"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)
    prefix = extract_prefix(filename)

    if not prefix or prefix not in MIGRATION_MAP:
        return False, f"skip (no mapping)"

    cfg = MIGRATION_MAP[prefix]
    var_name = cfg['var']
    api_path = cfg['api']
    field_name = cfg['field']

    # 1. Props에서 adminData/dispDataset 제거
    old_props_pattern = r"props:\s*\[\s*['\"]navigate['\"],\s*['\"](?:admin|disp)Data['\"],\s*"
    if re.search(old_props_pattern, content):
        content = re.sub(old_props_pattern, "props: ['navigate', ", content)

    # 2. 이미 수정된 경우 스킵
    if 'const { ref, reactive, computed' in content and ', onMounted' in content:
        return False, "already migrated"

    # 3. destructuring에 onMounted 추가
    content = re.sub(
        r"const \{ ref, reactive, computed \}",
        "const { ref, reactive, computed, onMounted }",
        content
    )

    # 4. setup 직후에 로컬 데이터 + onMounted 블록 추가
    # setup(props) { 찾기
    setup_match = re.search(r'setup\(props\)\s*\{', content)
    if not setup_match:
        return False, "no setup found"

    insert_pos = setup_match.end()

    # 이미 추가된 경우 스킵
    if f'const {var_name} = ref(' in content:
        return False, "local var already exists"

    local_block = f"""
    // 로컬 데이터 (adminData 대신)
    const {var_name} = ref([]);
    const loading = ref(false);
    const error = ref(null);

    // onMounted에서 API 로드
    onMounted(async () => {{
      loading.value = true;
      try {{
        const res = await window.adminApi.get('{api_path}', {{
          params: {{ pageNo: 1, pageSize: 10000 }}
        }});
        {var_name}.value = res.data?.data?.{field_name} || [];
        error.value = null;
      }} catch (err) {{
        error.value = err.message;
        if (props.showToast) props.showToast('{prefix} 로드 실패', 'error');
      }} finally {{
        loading.value = false;
      }}
    }});"""

    content = content[:insert_pos] + local_block + content[insert_pos:]

    # 5. props.adminData.VAR -> VAR.value 치환
    plural = var_name  # members, products, etc.
    content = re.sub(
        rf'props\.adminData\.{plural}(?![\w])',  # 단어경계
        f'{plural}.value',
        content
    )

    # props.dispDataset.VAR도 처리
    content = re.sub(
        rf'props\.dispDataset\.{plural}(?![\w])',
        f'{plural}.value',
        content
    )

    # 6. 템플릿의 :admin-data 제거
    content = re.sub(
        r'\s+:admin-data="adminData"\s*',
        ' ',
        content
    )
    content = re.sub(
        r'\s+:disp-dataset="adminData"\s*',
        ' ',
        content
    )

    # 7. return 문 수정
    return_match = re.search(r'return\s*\{\s*(\w+)', content)
    if return_match:
        first_var = return_match.group(1)
        if first_var != var_name:  # 이미 있으면 스킵
            content = re.sub(
                r'return\s*\{\s*',
                f'return {{ {var_name}, loading, error, ',
                content,
                count=1
            )

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return True, f"ok ({var_name})"

def main():
    base = "c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/pages/admin"

    files = []
    for root, dirs, fnames in os.walk(base):
        for fname in fnames:
            if re.search(r'(?:Mng|Dtl|Hist)\.js$', fname):
                files.append(os.path.join(root, fname))

    files.sort()

    success, skip, fail = 0, 0, 0

    for fpath in files:
        fname = os.path.basename(fpath)
        ok, msg = migrate_file(fpath)

        status = "OK" if ok else "SKIP"
        print(f"[{status}] {fname} - {msg}")

        if ok:
            success += 1
        else:
            skip += 1

    print(f"\n=== 결과 ===")
    print(f"성공: {success}, 스킵: {skip}, 총: {len(files)}")

if __name__ == '__main__':
    main()
