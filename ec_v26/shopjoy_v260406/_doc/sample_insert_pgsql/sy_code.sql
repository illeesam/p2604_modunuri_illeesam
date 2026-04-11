-- ============================================================
-- sy_code 샘플 데이터
-- ID 규칙: YYMMDDhhmmss + random(4) = VARCHAR(16)
-- ============================================================

-- 코드 그룹
INSERT INTO sy_code_grp (code_grp, grp_name, description, use_yn) VALUES
('MEMBER_GRADE',  '회원등급',       '회원 등급 구분',           'Y'),
('MEMBER_STATUS', '회원상태',       '회원 활동 상태',           'Y'),
('GENDER',        '성별',           '성별 구분',                'Y'),
('ORDER_STATUS',  '주문상태',       '주문 처리 단계',           'Y'),
('PAY_METHOD',    '결제수단',       '결제 방법',                'Y'),
('REFUND_METHOD', '환불수단',       '환불 처리 방법',           'Y'),
('COURIER',       '택배사',         '배송 택배사',              'Y'),
('DLIV_STATUS',   '배송상태',       '배송 처리 단계',           'Y'),
('CLAIM_TYPE',    '클레임유형',     '취소/반품/교환 구분',      'Y'),
('CLAIM_STATUS',  '클레임상태',     '클레임 처리 단계',         'Y'),
('CLAIM_REASON',  '클레임사유',     '클레임 요청 사유',         'Y'),
('PRODUCT_STATUS','상품상태',       '상품 판매 상태',           'Y'),
('PRODUCT_SIZE',  '상품사이즈',     '의류 사이즈',              'Y'),
('COUPON_TYPE',   '쿠폰유형',       '할인 쿠폰 유형',           'Y'),
('COUPON_STATUS', '쿠폰상태',       '쿠폰 활성 상태',           'Y'),
('CACHE_TYPE',    '적립금유형',     '적립금 변동 유형',         'Y'),
('EVENT_TYPE',    '이벤트유형',     '이벤트 종류',              'Y'),
('EVENT_STATUS',  '이벤트상태',     '이벤트 진행 상태',         'Y'),
('DISP_TYPE',     '디스플레이유형', '위젯 표시 방식',           'Y'),
('DISP_STATUS',   '디스플레이상태', '패널 활성 상태',           'Y'),
('DISP_AREA',     '디스플레이영역', '노출 영역 코드',           'Y'),
('NOTICE_TYPE',   '공지유형',       '공지사항 종류',            'Y'),
('CONTACT_STATUS','문의상태',       '1:1 문의 처리 상태',       'Y'),
('CHATT_STATUS',  '채팅상태',       '채팅방 상태',              'Y'),
('ALARM_TYPE',    '알림유형',       '알림 발송 유형',           'Y'),
('ALARM_CHANNEL', '알림채널',       '발송 채널',                'Y'),
('TEMPLATE_TYPE', '템플릿유형',     '발송 템플릿 종류',         'Y'),
('BATCH_CYCLE',   '배치주기',       '배치 실행 주기',           'Y'),
('BATCH_STATUS',  '배치상태',       '배치 활성 상태',           'Y'),
('VENDOR_STATUS', '업체상태',       '업체 계약 상태',           'Y'),
('SITE_STATUS',   '사이트상태',     '사이트 운영 상태',         'Y'),
('USER_STATUS',   '사용자상태',     '관리자 계정 상태',         'Y'),
('DEPT_TYPE',     '부서유형',       '조직 부서 유형',           'Y'),
('USE_YN',        '사용여부',       '공통 사용여부',            'Y');

-- ==============================
-- 코드 항목
-- ==============================

-- 회원등급
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000001001', 'MEMBER_GRADE', 'BASIC',  '일반',   1, 'Y'),
('2604110000001002', 'MEMBER_GRADE', 'SILVER', '실버',   2, 'Y'),
('2604110000001003', 'MEMBER_GRADE', 'GOLD',   '골드',   3, 'Y'),
('2604110000001004', 'MEMBER_GRADE', 'VIP',    'VIP',    4, 'Y');

-- 회원상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000002001', 'MEMBER_STATUS', 'ACTIVE',    '정상',     1, 'Y'),
('2604110000002002', 'MEMBER_STATUS', 'INACTIVE',  '비활성',   2, 'Y'),
('2604110000002003', 'MEMBER_STATUS', 'SUSPENDED', '정지',     3, 'Y'),
('2604110000002004', 'MEMBER_STATUS', 'WITHDRAWN', '탈퇴',     4, 'Y');

-- 성별
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000003001', 'GENDER', 'M', '남성', 1, 'Y'),
('2604110000003002', 'GENDER', 'F', '여성', 2, 'Y');

-- 주문상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000004001', 'ORDER_STATUS', 'PENDING',   '결제대기',  1, 'Y'),
('2604110000004002', 'ORDER_STATUS', 'PAID',      '결제완료',  2, 'Y'),
('2604110000004003', 'ORDER_STATUS', 'PREPARING', '상품준비',  3, 'Y'),
('2604110000004004', 'ORDER_STATUS', 'SHIPPED',   '배송중',    4, 'Y'),
('2604110000004005', 'ORDER_STATUS', 'DELIVERED', '배송완료',  5, 'Y'),
('2604110000004006', 'ORDER_STATUS', 'CANCELLED', '취소',      6, 'Y');

-- 결제수단
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000005001', 'PAY_METHOD', 'CARD',   '신용카드',   1, 'Y'),
('2604110000005002', 'PAY_METHOD', 'BANK',   '계좌이체',   2, 'Y'),
('2604110000005003', 'PAY_METHOD', 'VBANK',  '가상계좌',   3, 'Y'),
('2604110000005004', 'PAY_METHOD', 'KAKAO',  '카카오페이', 4, 'Y'),
('2604110000005005', 'PAY_METHOD', 'NAVER',  '네이버페이', 5, 'Y'),
('2604110000005006', 'PAY_METHOD', 'CACHE',  '적립금',     6, 'Y');

-- 환불수단
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000006001', 'REFUND_METHOD', 'CARD',  '카드취소',  1, 'Y'),
('2604110000006002', 'REFUND_METHOD', 'BANK',  '계좌환불',  2, 'Y'),
('2604110000006003', 'REFUND_METHOD', 'CACHE', '적립금환불', 3, 'Y');

-- 택배사
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000007001', 'COURIER', 'CJ',     'CJ대한통운',  1, 'Y'),
('2604110000007002', 'COURIER', 'LOGEN',  '로젠택배',    2, 'Y'),
('2604110000007003', 'COURIER', 'POST',   '우체국택배',  3, 'Y'),
('2604110000007004', 'COURIER', 'HANJIN', '한진택배',    4, 'Y'),
('2604110000007005', 'COURIER', 'LOTTE',  '롯데택배',    5, 'Y');

-- 배송상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000008001', 'DLIV_STATUS', 'READY',      '배송준비',   1, 'Y'),
('2604110000008002', 'DLIV_STATUS', 'SHIPPED',    '출고완료',   2, 'Y'),
('2604110000008003', 'DLIV_STATUS', 'IN_TRANSIT', '배송중',     3, 'Y'),
('2604110000008004', 'DLIV_STATUS', 'DELIVERED',  '배송완료',   4, 'Y'),
('2604110000008005', 'DLIV_STATUS', 'FAILED',     '배송실패',   5, 'Y');

-- 클레임유형
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000009001', 'CLAIM_TYPE', 'CANCEL',   '취소',  1, 'Y'),
('2604110000009002', 'CLAIM_TYPE', 'RETURN',   '반품',  2, 'Y'),
('2604110000009003', 'CLAIM_TYPE', 'EXCHANGE', '교환',  3, 'Y');

-- 클레임상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000010001', 'CLAIM_STATUS', 'REQUESTED',  '접수',    1, 'Y'),
('2604110000010002', 'CLAIM_STATUS', 'CONFIRMED',  '확인',    2, 'Y'),
('2604110000010003', 'CLAIM_STATUS', 'PROCESSING', '처리중',  3, 'Y'),
('2604110000010004', 'CLAIM_STATUS', 'COMPLETED',  '완료',    4, 'Y'),
('2604110000010005', 'CLAIM_STATUS', 'REJECTED',   '거절',    5, 'Y');

-- 클레임사유
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000011001', 'CLAIM_REASON', 'MIND_CHANGE', '단순변심',   1, 'Y'),
('2604110000011002', 'CLAIM_REASON', 'DEFECT',      '상품불량',   2, 'Y'),
('2604110000011003', 'CLAIM_REASON', 'WRONG',       '오배송',     3, 'Y'),
('2604110000011004', 'CLAIM_REASON', 'OTHER',       '기타',       4, 'Y');

-- 상품상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000012001', 'PRODUCT_STATUS', 'ACTIVE',   '판매중',    1, 'Y'),
('2604110000012002', 'PRODUCT_STATUS', 'INACTIVE', '비공개',    2, 'Y'),
('2604110000012003', 'PRODUCT_STATUS', 'SOLDOUT',  '품절',      3, 'Y'),
('2604110000012004', 'PRODUCT_STATUS', 'DELETED',  '삭제',      4, 'Y');

-- 상품사이즈
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000013001', 'PRODUCT_SIZE', 'XS',   'XS',    1, 'Y'),
('2604110000013002', 'PRODUCT_SIZE', 'S',    'S',     2, 'Y'),
('2604110000013003', 'PRODUCT_SIZE', 'M',    'M',     3, 'Y'),
('2604110000013004', 'PRODUCT_SIZE', 'L',    'L',     4, 'Y'),
('2604110000013005', 'PRODUCT_SIZE', 'XL',   'XL',    5, 'Y'),
('2604110000013006', 'PRODUCT_SIZE', 'XXL',  'XXL',   6, 'Y'),
('2604110000013007', 'PRODUCT_SIZE', 'FREE', '프리',  7, 'Y');

-- 쿠폰유형
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000014001', 'COUPON_TYPE', 'RATE',  '정률할인', 1, 'Y'),
('2604110000014002', 'COUPON_TYPE', 'FIXED', '정액할인', 2, 'Y');

-- 쿠폰상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000015001', 'COUPON_STATUS', 'ACTIVE',   '사용가능', 1, 'Y'),
('2604110000015002', 'COUPON_STATUS', 'INACTIVE', '비활성',  2, 'Y'),
('2604110000015003', 'COUPON_STATUS', 'EXPIRED',  '만료',    3, 'Y');

-- 적립금유형
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000016001', 'CACHE_TYPE', 'EARN',  '적립',       1, 'Y'),
('2604110000016002', 'CACHE_TYPE', 'USE',   '사용',       2, 'Y'),
('2604110000016003', 'CACHE_TYPE', 'EXPIRE','소멸',       3, 'Y'),
('2604110000016004', 'CACHE_TYPE', 'ADMIN', '관리자조정', 4, 'Y');

-- 이벤트유형
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000017001', 'EVENT_TYPE', 'SALE',   '할인이벤트', 1, 'Y'),
('2604110000017002', 'EVENT_TYPE', 'LUCKY',  '럭키드로우', 2, 'Y'),
('2604110000017003', 'EVENT_TYPE', 'REVIEW', '리뷰이벤트', 3, 'Y'),
('2604110000017004', 'EVENT_TYPE', 'JOIN',   '가입이벤트', 4, 'Y');

-- 이벤트상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000018001', 'EVENT_STATUS', 'ACTIVE',   '진행중', 1, 'Y'),
('2604110000018002', 'EVENT_STATUS', 'INACTIVE', '비활성', 2, 'Y'),
('2604110000018003', 'EVENT_STATUS', 'ENDED',    '종료',   3, 'Y');

-- 디스플레이유형
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000019001', 'DISP_TYPE', 'SLIDE',  '슬라이드', 1, 'Y'),
('2604110000019002', 'DISP_TYPE', 'GRID',   '그리드',   2, 'Y'),
('2604110000019003', 'DISP_TYPE', 'LIST',   '리스트',   3, 'Y'),
('2604110000019004', 'DISP_TYPE', 'SINGLE', '단일',     4, 'Y');

-- 디스플레이상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000020001', 'DISP_STATUS', 'ACTIVE',   '노출중',   1, 'Y'),
('2604110000020002', 'DISP_STATUS', 'INACTIVE', '미노출',   2, 'Y');

-- 디스플레이영역
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000021001', 'DISP_AREA', 'MAIN_TOP',      '메인 상단',    1, 'Y'),
('2604110000021002', 'DISP_AREA', 'MAIN_BANNER',   '메인 배너',    2, 'Y'),
('2604110000021003', 'DISP_AREA', 'MAIN_PRODUCT',  '메인 상품',    3, 'Y'),
('2604110000021004', 'DISP_AREA', 'MAIN_BOTTOM',   '메인 하단',    4, 'Y'),
('2604110000021005', 'DISP_AREA', 'CATEGORY_TOP',  '카테고리 상단', 5, 'Y'),
('2604110000021006', 'DISP_AREA', 'POPUP',         '팝업',         6, 'Y');

-- 공지유형
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000022001', 'NOTICE_TYPE', 'GENERAL', '일반공지',   1, 'Y'),
('2604110000022002', 'NOTICE_TYPE', 'EVENT',   '이벤트',     2, 'Y'),
('2604110000022003', 'NOTICE_TYPE', 'SERVICE', '서비스안내', 3, 'Y'),
('2604110000022004', 'NOTICE_TYPE', 'SYSTEM',  '시스템',     4, 'Y');

-- 문의상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000023001', 'CONTACT_STATUS', 'PENDING',  '답변대기', 1, 'Y'),
('2604110000023002', 'CONTACT_STATUS', 'ANSWERED', '답변완료', 2, 'Y'),
('2604110000023003', 'CONTACT_STATUS', 'CLOSED',   '종료',     3, 'Y');

-- 채팅상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000024001', 'CHATT_STATUS', 'OPEN',   '진행중', 1, 'Y'),
('2604110000024002', 'CHATT_STATUS', 'CLOSED', '종료',   2, 'Y');

-- 알림유형
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000025001', 'ALARM_TYPE', 'ORDER',     '주문알림',   1, 'Y'),
('2604110000025002', 'ALARM_TYPE', 'CLAIM',     '클레임알림', 2, 'Y'),
('2604110000025003', 'ALARM_TYPE', 'SYSTEM',    '시스템알림', 3, 'Y'),
('2604110000025004', 'ALARM_TYPE', 'MARKETING', '마케팅',     4, 'Y');

-- 알림채널
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000026001', 'ALARM_CHANNEL', 'EMAIL', '이메일',     1, 'Y'),
('2604110000026002', 'ALARM_CHANNEL', 'SMS',   'SMS',        2, 'Y'),
('2604110000026003', 'ALARM_CHANNEL', 'PUSH',  '푸시알림',   3, 'Y'),
('2604110000026004', 'ALARM_CHANNEL', 'KAKAO', '카카오알림', 4, 'Y');

-- 템플릿유형
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000027001', 'TEMPLATE_TYPE', 'EMAIL', '이메일',     1, 'Y'),
('2604110000027002', 'TEMPLATE_TYPE', 'SMS',   'SMS',        2, 'Y'),
('2604110000027003', 'TEMPLATE_TYPE', 'PUSH',  '푸시',       3, 'Y'),
('2604110000027004', 'TEMPLATE_TYPE', 'KAKAO', '카카오',     4, 'Y');

-- 배치주기
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000028001', 'BATCH_CYCLE', 'HOURLY',  '매시간',  1, 'Y'),
('2604110000028002', 'BATCH_CYCLE', 'DAILY',   '매일',    2, 'Y'),
('2604110000028003', 'BATCH_CYCLE', 'WEEKLY',  '매주',    3, 'Y'),
('2604110000028004', 'BATCH_CYCLE', 'MONTHLY', '매월',    4, 'Y'),
('2604110000028005', 'BATCH_CYCLE', 'MANUAL',  '수동',    5, 'Y');

-- 배치상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000029001', 'BATCH_STATUS', 'ACTIVE',   '활성', 1, 'Y'),
('2604110000029002', 'BATCH_STATUS', 'INACTIVE', '비활성', 2, 'Y');

-- 업체상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000030001', 'VENDOR_STATUS', 'ACTIVE',    '계약중',   1, 'Y'),
('2604110000030002', 'VENDOR_STATUS', 'INACTIVE',  '비활성',   2, 'Y'),
('2604110000030003', 'VENDOR_STATUS', 'SUSPENDED', '계약정지', 3, 'Y');

-- 사이트상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000031001', 'SITE_STATUS', 'ACTIVE',      '운영중',     1, 'Y'),
('2604110000031002', 'SITE_STATUS', 'MAINTENANCE', '점검중',     2, 'Y'),
('2604110000031003', 'SITE_STATUS', 'INACTIVE',    '비활성',     3, 'Y');

-- 사용자상태
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000032001', 'USER_STATUS', 'ACTIVE',   '정상',  1, 'Y'),
('2604110000032002', 'USER_STATUS', 'INACTIVE', '비활성', 2, 'Y'),
('2604110000032003', 'USER_STATUS', 'LOCKED',   '잠금',  3, 'Y');

-- 부서유형
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000033001', 'DEPT_TYPE', 'HQ',     '본사',  1, 'Y'),
('2604110000033002', 'DEPT_TYPE', 'BRANCH', '지점',  2, 'Y'),
('2604110000033003', 'DEPT_TYPE', 'TEAM',   '팀',    3, 'Y');

-- 사용여부
INSERT INTO sy_code (code_id, code_grp, code_value, code_label, sort_ord, use_yn) VALUES
('2604110000034001', 'USE_YN', 'Y', '사용', 1, 'Y'),
('2604110000034002', 'USE_YN', 'N', '미사용', 2, 'Y');
