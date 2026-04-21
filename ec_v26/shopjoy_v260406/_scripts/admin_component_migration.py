#!/usr/bin/env python3
# Admin 컴포넌트 자동 마이그레이션 스크립트
import os
import re
import json

# API 엔드포인트 매핑: 파일명 패턴 -> (변수명, API_경로, 배열_필드)
ENDPOINT_MAP = {
    # EC - 회원
    'MbMember': ('members', '/bo/ec/mb/member/page', 'list', 'memberId'),
    'MbMemGrade': ('grades', '/bo/ec/mb/mem-grade/page', 'list', 'gradeId'),
    'MbMemGroup': ('groups', '/bo/ec/mb/mem-group/page', 'list', 'groupId'),

    # EC - 상품
    'PdProd': ('products', '/bo/ec/pd/prod/page', 'list', 'prodId'),
    'PdCategory': ('categories', '/bo/ec/pd/category/page', 'list', 'categoryId'),
    'PdBundle': ('bundles', '/bo/ec/pd/bundle/page', 'list', 'bundleId'),
    'PdSet': ('sets', '/bo/ec/pd/set/page', 'list', 'setId'),
    'PdTag': ('tags', '/bo/ec/pd/tag/page', 'list', 'tagId'),
    'PdReview': ('reviews', '/bo/ec/pd/review/page', 'list', 'reviewId'),
    'PdQna': ('qnas', '/bo/ec/pd/qna/page', 'list', 'qnaId'),
    'PdRestockNoti': ('restockNotis', '/bo/ec/pd/restock-noti/page', 'list', 'notiId'),

    # EC - 주문
    'OdOrder': ('orders', '/bo/ec/od/order/page', 'list', 'orderId'),
    'OdClaim': ('claims', '/bo/ec/od/claim/page', 'list', 'claimId'),
    'OdDliv': ('deliveries', '/bo/ec/od/dliv/page', 'list', 'dlivId'),

    # EC - 프로모션
    'PmCoupon': ('coupons', '/bo/ec/pm/coupon/page', 'list', 'couponId'),
    'PmCache': ('caches', '/bo/ec/pm/cache/page', 'list', 'cacheId'),
    'PmEvent': ('events', '/bo/ec/pm/event/page', 'list', 'eventId'),
    'PmPlan': ('plans', '/bo/ec/pm/plan/page', 'list', 'planId'),
    'PmDiscnt': ('discounts', '/bo/ec/pm/discnt/page', 'list', 'discntId'),
    'PmSave': ('saves', '/bo/ec/pm/save/page', 'list', 'saveId'),
    'PmGift': ('gifts', '/bo/ec/pm/gift/page', 'list', 'giftId'),
    'PmVoucher': ('vouchers', '/bo/ec/pm/voucher/page', 'list', 'voucherId'),

    # EC - 전시
    'DpDispUi': ('displays', '/bo/ec/dp/ui/page', 'list', 'uiId'),
    'DpDispArea': ('areas', '/bo/ec/dp/area/page', 'list', 'areaId'),
    'DpDispPanel': ('panels', '/bo/ec/dp/panel/page', 'list', 'panelId'),
    'DpDispWidget': ('widgets', '/bo/ec/dp/widget/page', 'list', 'widgetId'),
    'DpDispWidgetLib': ('widgetLibs', '/bo/ec/dp/widget-lib/page', 'list', 'libId'),

    # EC - 고객센터
    'CmChatt': ('chatts', '/bo/ec/cm/chatt/page', 'list', 'chattId'),
    'CmBlog': ('blogs', '/bo/ec/cm/blog/page', 'list', 'blogId'),
    'CmNotice': ('notices', '/bo/ec/cm/notice/page', 'list', 'noticeId'),

    # SY - 기본정보
    'SySite': ('sites', '/bo/sy/site/page', 'list', 'siteId'),
    'SyCode': ('codes', '/bo/sy/code/page', 'list', 'codeId'),
    'SyBrand': ('brands', '/bo/sy/brand/page', 'list', 'brandId'),
    'SyAttach': ('attachs', '/bo/sy/attach/page', 'list', 'attachId'),
    'SyTemplate': ('templates', '/bo/sy/template/page', 'list', 'templateId'),
    'SyVendor': ('vendors', '/bo/sy/vendor/page', 'list', 'vendorId'),
    'SyBiz': ('bizs', '/bo/sy/biz/page', 'list', 'bizId'),
    'SyBizUser': ('bizUsers', '/bo/sy/biz-user/page', 'list', 'bizUserId'),

    # SY - 조직/메뉴/권한
    'SyDept': ('depts', '/bo/sy/dept/page', 'list', 'deptId'),
    'SyMenu': ('menus', '/bo/sy/menu/page', 'list', 'menuId'),
    'SyRole': ('roles', '/bo/sy/role/page', 'list', 'roleId'),
    'SyUser': ('users', '/bo/sy/user/page', 'list', 'userId'),

    # SY - 기타
    'SyBatch': ('batches', '/bo/sy/batch/page', 'list', 'batchId'),
    'SyAlarm': ('alarms', '/bo/sy/alarm/page', 'list', 'alarmId'),
    'SyBbm': ('bbms', '/bo/sy/bbm/page', 'list', 'bbmId'),
    'SyBbs': ('bbss', '/bo/sy/bbs/page', 'list', 'bbsId'),
    'SyContact': ('contacts', '/bo/sy/contact/page', 'list', 'contactId'),
    'MbCustInfo': ('custInfos', '/bo/ec/mb/cust-info/page', 'list', 'custId'),
}

def extract_class_prefix(filename):
    """파일명에서 클래스 프리픽스 추출 (e.g., 'MbMemberMng.js' -> 'MbMember')"""
    match = re.match(r'([A-Z][a-z][A-Z][a-z\w]+?)(?:Mng|Dtl|Hist)\.js$', filename)
    if match:
        return match.group(1)
    return None

def get_endpoint_info(prefix):
    """프리픽스로부터 API 정보 조회"""
    return ENDPOINT_MAP.get(prefix)

def migrate_component(filepath):
    """단일 컴포넌트 파일 마이그레이션"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    filename = os.path.basename(filepath)
    prefix = extract_class_prefix(filename)

    if not prefix:
        print(f"[SKIP] {filename} - 프리픽스 추출 실패")
        return False

    endpoint_info = get_endpoint_info(prefix)
    if not endpoint_info:
        print(f"[SKIP] {filename} ({prefix}) - 엔드포인트 매핑 없음")
        return False

    var_name, api_path, data_field, id_field = endpoint_info

    # 1. Props에서 adminData/dispDataset 제거
    if 'props:' in content and 'adminData' in content:
        content = re.sub(
            r"props:\s*\[\s*['\"]navigate['\"],\s*['\"]adminData['\"],\s*",
            "props: ['navigate', ",
            content
        )
        content = re.sub(
            r"props:\s*\[\s*['\"]navigate['\"],\s*['\"]dispDataset['\"],\s*",
            "props: ['navigate', ",
            content
        )

    # 2. Props 제거 (빈 배열 정리)
    content = re.sub(
        r"props:\s*\[\s*['\"]navigate['\"],\s*,\s*",
        "props: ['navigate', ",
        content
    )

    # 3. setup에 onMounted 추가
    if 'const { ref, reactive, computed' in content:
        content = content.replace(
            'const { ref, reactive, computed',
            'const { ref, reactive, computed, onMounted'
        )

    # 4. 로컬 데이터 ref 추가 (setup 시작 부분)
    # setup(props) { ... 직후에 추가
    setup_match = re.search(r'setup\(props\)\s*\{', content)
    if setup_match:
        insert_pos = setup_match.end()
        local_data = f"""
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
        {var_name}.value = res.data?.data?.{data_field} || [];
        error.value = null;
      }} catch (err) {{
        error.value = err.message;
        props.showToast('{prefix} 로드 실패', 'error');
      }} finally {{
        loading.value = false;
      }}
    }});
"""
        content = content[:insert_pos] + local_data + content[insert_pos:]

    # 5. props.adminData.* 를 로컬 변수로 치환
    # MNG 패턴: props.adminData.members -> members.value
    singular_map = {
        'members': 'member',
        'products': 'product',
        'orders': 'order',
        'claims': 'claim',
        'deliveries': 'delivery',
        'coupons': 'coupon',
        'caches': 'cache',
        'events': 'event',
        'plans': 'plan',
        'discounts': 'discount',
        'reviews': 'review',
        'qnas': 'qna',
        'chatts': 'chatt',
        'notices': 'notice',
        'contacts': 'contact',
        'depts': 'dept',
        'roles': 'role',
        'users': 'user',
        'sites': 'site',
        'codes': 'code',
        'brands': 'brand',
        'templates': 'template',
        'vendors': 'vendor',
        'batches': 'batch',
        'alarms': 'alarm',
    }

    content = re.sub(
        rf'props\.adminData\.{var_name}',
        f'{var_name}.value',
        content
    )

    # 6. return 문에 로컬 변수 추가
    return_match = re.search(r'return\s*\{\s*', content)
    if return_match:
        content = re.sub(
            r'return\s*\{\s*',
            f'return {{ {var_name}, loading, error, ',
            content,
            count=1
        )

    # 파일 저장
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"[OK] {filename} ({prefix} -> {var_name})")
    return True

def main():
    base_path = "c:/_pjt_github/p2604_modunuri_illeesam/ec_v26/shopjoy_v260406/pages/admin"

    # Mng/Dtl/Hist 파일 수집
    components = []
    for root, dirs, files in os.walk(base_path):
        for f in files:
            if re.match(r'.*(?:Mng|Dtl|Hist)\.js$', f):
                components.append(os.path.join(root, f))

    components.sort()

    success = 0
    skip = 0

    for filepath in components:
        if migrate_component(filepath):
            success += 1
        else:
            skip += 1

    print(f"\n=== 마이그레이션 완료 ===")
    print(f"성공: {success}, 스킵: {skip}, 총: {len(components)}")

if __name__ == '__main__':
    main()
