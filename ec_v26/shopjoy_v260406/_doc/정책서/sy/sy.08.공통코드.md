# sy.08. 공통코드 관리 정책

> **공통코드 단일 소스**: 이 문서가 시스템 공통코드의 유일한 정의 출처입니다.

## 목적
시스템 전체의 공통코드 표준화 및 관리 정책 정의

## 코드 구조
```
코드그룹 (sy_code_grp.code_grp)
└─ 코드값 (sy_code.code_value)
└─ 라벨 (sy_code.code_label)
```

## 명명 규칙
- 포맷: 대문자 + 언더스코어 (예: `PAY_METHOD`, `MEMBER_GRADE`)
- 그룹명 = DDL에서 대표로 사용하는 컬럼명에서 `_cd` 제거 후 대문자화
  - 예: `order_status_cd` → `ORDER_STATUS`, `widget_type_cd` → `WIDGET_TYPE`

## 코드 변경 정책
- **SYSTEM**: 개발팀 승인 필요, 폐기만 가능
- **BUSINESS**: 추가·수정 가능, 사용중 코드는 폐기만
- **CUSTOM**: 자유 추가·수정·삭제

---

## 공통코드 목록

### 회원 (MB)

#### MEMBER_STATUS — 회원상태
| code_value | label | 설명 |
|---|---|---|
| ACTIVE | 정상 | 정상 활동 회원 |
| DORMANT | 휴면 | 장기 미접속 휴면 |
| SUSPENDED | 강제정지 | 관리자 강제 정지 |
| WITHDRAW_WAIT | 탈퇴대기 | 탈퇴 신청 처리 중 |
| WITHDRAWN | 탈퇴 | 탈퇴 완료 |
| FORCED_WITHDRAWN | 강제탈퇴 | 관리자 강제 탈퇴 |
> 적용: `mb_member.member_status_cd`

#### MEMBER_GRADE — 회원등급
| code_value | label |
|---|---|
| BASIC | 일반 |
| SILVER | 실버 |
| GOLD | 골드 |
| VIP | VIP |
> 적용: `mb_member.grade_cd`, `od_order.order_grade_cd`, `pm_coupon.mem_grade_cd`, `pm_discnt.mem_grade_cd`, `pm_gift.mem_grade_cd`

#### GENDER — 성별
| code_value | label |
|---|---|
| M | 남성 |
| F | 여성 |
> 적용: `mb_member.gender_cd`

#### SNS_CHANNEL — SNS 연동 채널
| code_value | label |
|---|---|
| KAKAO | 카카오 |
| NAVER | 네이버 |
| GOOGLE | 구글 |
| APPLE | 애플 |
> 적용: `mb_member_sns.sns_channel_cd`

#### MEMBER_WITHDRAW_REASON — 탈퇴사유
| code_value | label |
|---|---|
| REJOIN | 탈퇴 후 재가입 |
| DELIVERY | 배송서비스 불만 |
| PRODUCT | 상품/가격 불만 |
| BENEFIT | 혜택 부족 |
| LOW_USE | 이용빈도 낮음 |
| UX | 이용 불편 |
| OTHER | 기타 |
> 적용: `mb_member_withdraw.reason_cd`

#### AUTH_METHOD — 로그인인증방법
| code_value | label |
|---|---|
| EMAIL | 이메일·비밀번호 |
| GOOGLE | 구글 소셜 로그인 |
| KAKAO | 카카오 소셜 로그인 |
| NAVER | 네이버 소셜 로그인 |
> 적용: `mb_member.auth_method_cd`

#### LOGIN_RESULT — 로그인결과
| code_value | label |
|---|---|
| SUCCESS | 성공 |
| FAIL_PW | 비밀번호 불일치 |
| FAIL_LOCKED | 계정 잠금 |
| FAIL_DORMANT | 휴면 계정 |
| FAIL_WITHDRAWN | 탈퇴 계정 |
> 적용: `mb_member_login_log.result_cd`, `sy_user_login_log.result_cd`, `mbh_member_login_log.result_cd`, `syh_user_login_log.result_cd`

#### TOKEN_ACTION — 토큰액션유형
| code_value | label |
|---|---|
| ISSUE | 발급 |
| REFRESH | 갱신 |
| EXPIRE | 만료 |
| REVOKE | 강제폐기 |
> 적용: `mbh_member_token_log.action_cd`, `syh_user_token_log.action_cd`

---

### 주문 (OD)

#### ORDER_STATUS — 주문상태
| code_value | label | 설명 |
|---|---|---|
| PENDING | 입금대기 | 무통장/가상계좌 입금 대기 |
| PAID | 결제완료 | 결제 승인 완료 |
| PREPARING | 상품준비중 | 출고 준비 |
| SHIPPED | 배송중 | 택배사 출고 |
| DELIVERED | 배송완료 | 수취 확인 |
| COMPLT | 구매확정 | 구매확정 처리 |
| CANCELLED | 취소 | 주문 취소 완료 |
| AUTO_CANCELLED | 자동취소 | 입금기한 초과 자동취소 |
> 적용: `od_order.order_status_cd`

#### ORDER_ITEM_STATUS — 주문항목상태
| code_value | label | 설명 |
|---|---|---|
| ORDERED | 주문완료 | 주문 생성 직후 |
| PAID | 결제완료 | 결제 승인 |
| PREPARING | 준비중 | 출고 준비 |
| SHIPPING | 배송중 | 출고 완료, 배송 중 |
| DELIVERED | 배송완료 | 수령 확인 |
| CONFIRMED | 구매확정 | 구매확정 처리 |
| CANCELLED | 취소 | 전량 취소/반품 완료 |
> 적용: `od_order_item.order_item_status_cd`

#### CLAIM_ITEM_STATUS — 클레임항목상태
| code_value | label | 설명 |
|---|---|---|
| REQUESTED | 신청 | 클레임 신청 접수 |
| APPROVED | 승인 | 클레임 승인 |
| IN_PICKUP | 수거중 | 반품·교환 수거 진행 |
| PROCESSING | 처리중 | 반품 입고 후 검품 |
| IN_TRANSIT | 교환출고중 | 교환상품 발송 |
| COMPLT | 완료 | 클레임 처리 완료 |
| REJECTED | 거부 | 클레임 거부 |
| CANCELLED | 취소 | 클레임 철회 |
> 적용: `od_claim_item.claim_item_status_cd`

#### CANCEL_REASON — 취소사유
| code_value | label | 배송비 부담 |
|---|---|---|
| MIND_CHANGE | 단순변심 | 구매자 |
| WRONG_OPTION | 옵션 선택 오류 | 구매자 |
| CHEAPER_ELSEWHERE | 타 사이트 더 저렴 | 구매자 |
| DELAY | 배송 예정일 지연 | 구매자 |
| REORDER | 추가상품 재주문 | 구매자 |
| OUT_OF_STOCK | 품절/판매중지 | 판매자 |
| BUYER_REQUEST | 구매자 직접 요청 | 구매자 |
| SELLER_FAULT | 판매자 귀책 | 판매자 |
| OTHER | 기타 | — |
> 적용: `od_claim.reason_cd` (CLAIM_TYPE=CANCEL 시)

#### RETURN_REASON — 반품사유
| code_value | label | 배송비 부담 |
|---|---|---|
| MIND_CHANGE | 단순변심 | 구매자 |
| SIZE_DIFF | 사이즈 불만 | 구매자 |
| COLOR_DIFF | 색상/소재 불만 | 구매자 |
| DEFECT | 파손/하자/포장불량 | 판매자 |
| WRONG_DELIVERY | 오배송 | 판매자 |
| OTHER_BUYER | 기타 (구매자 부담) | 구매자 |
| OTHER_SELLER | 기타 (판매자 부담) | 판매자 |
> 적용: `od_claim.reason_cd` (CLAIM_TYPE=RETURN 시)

#### EXCHANGE_REASON — 교환사유
| code_value | label | 배송비 부담 |
|---|---|---|
| SIZE_CHANGE | 사이즈 변경 | 구매자 |
| ORDER_MISTAKE | 주문 실수 | 구매자 |
| DEFECT | 파손/불량 | 판매자 |
| WRONG_DELIVERY | 오배송 | 판매자 |
> 적용: `od_claim.reason_cd` (CLAIM_TYPE=EXCHANGE 시)

#### CLAIM_TYPE — 클레임유형
| code_value | label |
|---|---|
| CANCEL | 취소 |
| RETURN | 반품 |
| EXCHANGE | 교환 |
> 적용: `od_claim.claim_type_cd`

#### CLAIM_STATUS — 클레임상태
| code_value | label |
|---|---|
| REQUESTED | 신청 |
| APPROVED | 승인 |
| IN_PICKUP | 수거중 |
| PROCESSING | 처리중 |
| REFUND_WAIT | 환불대기 |
| COMPLT | 완료 |
| REJECTED | 거부 |
| CANCELLED | 철회 |
> 적용: `od_claim.claim_status_cd`

#### ACCESS_CHANNEL — 접근채널
| code_value | label |
|---|---|
| WEB_PC | Web-PC |
| WEB_MOBILE | 모바일 웹 |
| APP_IOS | 앱-iOS |
| APP_ANDROID | 앱-Android |
> 적용: `od_order.access_channel_cd`

#### ORDER_DISCNT_TYPE — 주문할인유형
| code_value | label |
|---|---|
| SALE_PRICE | 판매가할인 |
| PAY_DISCNT | 결제할인 |
| COUPON | 쿠폰할인 |
| PROMOTION | 프로모션할인 |
| SHIP_DISCNT | 배송비할인 |
| PRODUCT_DISCNT | 상품할인 |
| CLAIM_SHIP | 클레임 배송비할인 |
> 적용: `od_order_discnt.discnt_type_cd`

#### APPROVAL_STATUS — 결재상태 (관리자 일괄결재)
| code_value | label | 설명 |
|---|---|---|
| REQ | 결재요청 | 추가결재 요청됨 |
| APPROVED | 승인 | 결재자 승인 완료 |
| REJECTED | 반려 | 결재자 반려 |
| DONE | 처리완료 | 결재 후 실무 처리 완료 |
> 적용: `od_order.appr_status_cd`, `od_claim.appr_status_cd`, `od_dliv.appr_status_cd`

#### APPROVAL_TARGET — 결재대상구분
| code_value | label |
|---|---|
| ORDER | 주문 |
| PROD | 상품 |
| DLIV | 배송 |
| EXTRA | 추가결제 |
> 적용: `od_order.appr_target_cd`, `od_claim.appr_target_cd`, `od_dliv.appr_target_cd`

---

### 결제 (PAY)

#### PAY_METHOD — 결제수단
| code_value | label |
|---|---|
| BANK_TRANSFER | 무통장입금 |
| VBANK | 가상계좌 |
| TOSS | 토스페이먼츠 |
| KAKAO | 카카오페이 |
| NAVER | 네이버페이 |
| MOBILE | 핸드폰결제 |
| SAVE | 적립금결제 |
| ZERO | 0원결제 |
> 적용: `od_order.pay_method_cd`, `od_pay.pay_method_cd`

#### PAY_CHANNEL — PG 세부채널
| code_value | label |
|---|---|
| CARD | 신용카드 |
| ACCOUNT | 계좌이체 |
| KAKAO | 카카오페이 |
| NAVER | 네이버페이 |
> 적용: `od_pay.pay_channel_cd`

#### PAY_STATUS — 결제상태
| code_value | label |
|---|---|
| PENDING | 대기 |
| COMPLT | 완료 |
| FAILED | 실패 |
| CANCELLED | 취소 |
| PARTIAL_REFUND | 부분환불 |
| REFUNDED | 전액환불 |
> 적용: `od_pay.pay_status_cd`

#### PAY_DIV — 주문/클레임 구분
| code_value | label | 설명 |
|---|---|---|
| ORDER | 주문 | 최초 주문 결제 |
| CLAIM | 클레임 | 클레임 추가결제 |
> 적용: `od_pay.pay_div_cd`

#### PAY_DIR — 입금/환불 방향
| code_value | label |
|---|---|
| DEPOSIT | 입금 |
| REFUND | 환불 |
> 적용: `od_pay.pay_dir_cd`

#### PAY_OCCUR_TYPE — 결제발생유형
| code_value | label | 설명 |
|---|---|---|
| ORDER | 주문결제 | 최초 주문 시 결제 |
| CLAIM_EXTRA | 클레임추가 | 반품/교환 추가배송비 결제 |
| EXCHANGE_EXTRA | 교환차액 | 교환상품 가격차 추가결제 |
> 적용: `od_pay.pay_occur_type_cd`

#### PAY_CHG_TYPE — 결제변경유형
| code_value | label |
|---|---|
| STATUS | 상태변경 |
| METHOD | 수단변경 |
| AMOUNT | 금액변경 |
> 적용: `odh_pay_chg_hist.chg_type_cd`

#### REFUND_METHOD — 환불수단
| code_value | label |
|---|---|
| CARD | 카드 취소 |
| BANK | 계좌이체 |
| CACHE | 캐시(충전금) 환급 |
> 적용: `od_claim.refund_method_cd`

#### REFUND_TYPE — 환불유형
| code_value | label | 설명 |
|---|---|---|
| CANCEL | 취소환불 | 주문 취소에 의한 환불 |
| RETURN | 반품환불 | 반품 완료 후 환불 |
| PARTIAL | 부분환불 | 부분취소·부분반품 환불 |
| EXTRA | 추가결제환불 | 추가결제 취소 환불 |
> 적용: `od_refund.refund_type_cd`

#### FAULT_TYPE — 귀책사유
| code_value | label |
|---|---|
| CUST | 구매자 귀책 |
| VENDOR | 판매자 귀책 |
| PLATFORM | 플랫폼 귀책 |
> 적용: `od_refund.fault_type_cd`, `od_claim.fault_type_cd`

#### REFUND_STATUS — 환불상태
| code_value | label |
|---|---|
| PENDING | 환불대기 |
| COMPLT | 환불완료 |
| FAILED | 환불실패 |
> 적용: `od_pay.refund_status_cd`

#### CARD_TYPE — 카드유형
| code_value | label |
|---|---|
| CREDIT | 신용카드 |
| DEBIT | 체크카드 |
| CHECK | 직불카드 |
> 적용: `od_pay.card_type_cd`

#### BANK_CODE — 은행코드
| code_value | label |
|---|---|
| 경남 | 경남은행 |
| 광주 | 광주은행 |
| 국민 | 국민은행 |
| 기업 | IBK기업은행 |
| 농협 | NH농협 |
| 대구 | 대구은행 |
| 부산 | 부산은행 |
| 산업 | KDB산업은행 |
| 새마을 | 새마을금고 |
| 수협 | 수협은행 |
| 신한 | 신한은행 |
| 신협 | 신협 |
| 씨티 | 씨티은행 |
| 우리 | 우리은행 |
| 우체국 | 우체국 |
| 전북 | 전북은행 |
| 제주 | 제주은행 |
| 카카오 | 카카오뱅크 |
| 케이 | 케이뱅크 |
| 하나 | KEB하나은행 |
> 적용: `od_pay.vbank_bank_code`, `od_order.refund_bank_cd`, `od_claim.refund_bank_cd`, `sy_vendor.bank_cd`

---

### 배송 (DLIV)

#### DLIV_STATUS — 배송상태
| code_value | label |
|---|---|
| READY | 준비중 |
| SHIPPED | 출고완료 |
| IN_TRANSIT | 배송중 |
| DELIVERED | 배송완료 |
| FAILED | 배송실패 |
> 적용: `od_dliv.dliv_status_cd`, `od_order.dliv_status_cd`, `od_claim.return_status_cd`

#### DLIV_DIV — 입출고구분
| code_value | label |
|---|---|
| OUTBOUND | 출고 (정상배송) |
| INBOUND | 입고 (반품수거) |
> 적용: `od_dliv.dliv_div_cd`

#### DLIV_TYPE — 배송유형
| code_value | label |
|---|---|
| NORMAL | 정상배송 |
| RETURN | 반품 |
| EXCHANGE | 교환반품 |
| EXCHANGE_OUT | 교환출고 |
> 적용: `od_dliv.dliv_type_cd`

#### DLIV_METHOD — 배송방법
| code_value | label |
|---|---|
| COURIER | 택배 |
| DIRECT | 직배송 |
| PICKUP | 방문수령 |
| SAME_DAY | 당일배송 |
> 적용: `pd_dliv_tmplt.dliv_method_cd`

#### DLIV_PAY_TYPE — 배송비결제
| code_value | label |
|---|---|
| PREPAY | 선결제 |
| COD | 착불 |
> 적용: `od_dliv.dliv_pay_type_cd`, `pd_dliv_tmplt.dliv_pay_type_cd`

#### DLIV_COST_TYPE — 배송비유형
| code_value | label |
|---|---|
| FREE | 무료배송 |
| FIXED | 고정배송비 |
| COND_FREE | 조건부 무료 (금액/수량 충족 시) |
| ISLAND_EXTRA | 도서산간 추가배송비 |
> 적용: `pd_dliv_tmplt.cost_type_cd`

#### COURIER — 택배사
| code_value | label |
|---|---|
| CJ | CJ대한통운 |
| LOGEN | 로젠택배 |
| POST | 우체국택배 |
| HANJIN | 한진택배 |
| LOTTE | 롯데택배 |
| KYOUNGDONG | 경동택배 |
| DIRECT | 직배송 |
> 적용: `od_dliv.outbound_courier_cd`, `od_dliv.inbound_courier_cd`, `od_order.dliv_courier_cd`, `od_claim.return_courier_cd`, `od_claim.exchange_courier_cd`

#### SHIPPING_FEE_TYPE — 배송비구분
| code_value | label | 설명 |
|---|---|---|
| OUTBOUND | 출고배송비 | 정상 발송 배송비 |
| RETURN | 반품수거비 | 반품 수거 배송비 |
| INBOUND | 반입배송비 | 반품 입고 배송비 |
| EXCHANGE | 교환발송비 | 교환상품 발송 배송비 |
> 적용: `od_dliv.shipping_fee_type_cd`

---

### 상품 (PD)

#### PRODUCT_STATUS — 상품상태
| code_value | label |
|---|---|
| DRAFT | 임시저장 |
| ACTIVE | 판매중 |
| STOPPED | 판매중지 |
| SOLD_OUT | 품절 |
| DISCONTINUED | 단종 |
> 적용: `pd_prod.prod_status_cd`

#### PRODUCT_TYPE — 상품유형
| code_value | label |
|---|---|
| SINGLE | 단일상품 |
| GROUP | 그룹상품 |
| SET | 세트상품 |
> 적용: `pd_prod.prod_type_cd`

#### VAT_TYPE — 부가세유형
| code_value | label |
|---|---|
| TAXABLE | 과세상품 |
| TAX_FREE | 면세상품 |
> 적용: `pd_prod.vat_type_cd`

#### OPT_TYPE — 옵션카테고리
상품·옵션그룹에서 어떤 종류의 옵션인지 분류. NONE은 옵션 없는 상품.
| code_value | label | 비고 |
|---|---|---|
| NONE | 옵션없음 | 단일상품, 옵션 미사용 |
| COLOR | 색상 | OPT_VAL에서 parentCodeValue=COLOR 값 목록 제공 |
| SIZE | 사이즈 | OPT_VAL에서 parentCodeValue=SIZE 값 목록 제공 |
| MATERIAL | 소재 | OPT_VAL에서 parentCodeValue=MATERIAL 값 목록 제공 |
| CUSTOM | 직접입력 | 프리셋 없이 관리자가 직접 opt_code 입력 |
> 적용: `pd_prod.opt_type_cd`, `pd_prod_opt_item.opt_type_cd`

#### OPT_VAL — 옵션프리셋값
OPT_TYPE 하위 사전정의 옵션값. `parentCodeValue`로 OPT_TYPE 값을 참조.
관리자가 opt_type_cd 선택 시 해당 parentCodeValue의 OPT_VAL 목록을 자동 제시 → `pd_prod_opt_item.opt_code`에 저장.
| code_value | label | parentCodeValue |
|---|---|---|
| BLACK | 검정 | COLOR |
| WHITE | 흰색 | COLOR |
| RED | 빨강 | COLOR |
| BLUE | 파랑 | COLOR |
| GREEN | 초록 | COLOR |
| YELLOW | 노랑 | COLOR |
| PINK | 핑크 | COLOR |
| PURPLE | 보라 | COLOR |
| GRAY | 회색 | COLOR |
| BROWN | 갈색 | COLOR |
| BEIGE | 베이지 | COLOR |
| ORANGE | 주황 | COLOR |
| NAVY | 네이비 | COLOR |
| XS | XS | SIZE |
| S | S | SIZE |
| M | M | SIZE |
| L | L | SIZE |
| XL | XL | SIZE |
| XXL | XXL | SIZE |
| FREE | FREE | SIZE |
| COTTON | 면 | MATERIAL |
| POLYESTER | 폴리에스터 | MATERIAL |
| LEATHER | 가죽 | MATERIAL |
| WOOL | 울 | MATERIAL |
| LINEN | 린넨 | MATERIAL |
> 적용: `pd_prod_opt_item.opt_code` (OPT_TYPE 선택 시 자동 제시, CUSTOM이면 직접 입력)

#### OPT_INPUT_TYPE — 옵션입력방식
옵션값 UI 입력 위젯 타입. OPT_TYPE과 별개로 각 옵션그룹의 입력 방식을 지정.
| code_value | label |
|---|---|
| SELECT | 선택형 |
| SELECT_INPUT | 선택+입력형 |
| MULTI_SELECT | 복수선택형 |
> 적용: `pd_prod_opt_item.opt_input_type_cd`

#### PROD_QNA_TYPE — 상품문의유형
| code_value | label |
|---|---|
| SIZE | 사이즈/스펙 |
| QUALITY | 품질/소재 |
| DLIV | 배송/재입고 |
| ETC | 기타 |
> 적용: `pd_prod_qna.qna_type_cd`

#### PROD_CONTENT_TYPE — 상품콘텐츠유형
| code_value | label |
|---|---|
| DETAIL | 상세설명 |
| NOTICE | 상품공지 |
| GUIDE | 이용안내 |
| SIZE_GUIDE | 사이즈안내 |
> 적용: `pd_prod_content.content_type_cd`

#### REVIEW_STATUS — 후기상태
| code_value | label |
|---|---|
| PENDING | 대기 |
| ACTIVE | 노출 |
| HIDDEN | 숨김 |
| DELETED | 삭제 |
> 적용: `pd_review.review_status_cd`

#### REVIEW_WRITER_TYPE — 후기작성자유형
| code_value | label |
|---|---|
| MEMBER | 회원 |
| ADMIN | 관리자 등록 |
> 적용: `pd_review.writer_type_cd`

#### LIKE_TARGET_TYPE — 찜 대상유형
| code_value | label |
|---|---|
| PRODUCT | 상품 |
| BRAND | 브랜드 |
> 적용: `mb_like.target_type_cd`

---

### 프로모션 (PM)

#### COUPON_TYPE — 쿠폰유형
| code_value | label |
|---|---|
| RATE | 정률할인 |
| FIXED | 정액할인 |
| SHIPPING | 배송비할인 |
> 적용: `pm_coupon.coupon_type_cd`

#### COUPON_ISSUE_TYPE — 쿠폰발급유형
| code_value | label |
|---|---|
| AUTO | 상품 자동적용 |
| MANUAL | 관리자 수동발급 |
| DOWNLOAD | 회원 다운로드 |
| JOIN | 신규가입 발급 |
| GRADE | 등급 발급 |
| BIRTHDAY | 생일 발급 |
| REFERRAL | 친구초대 발급 |
| FIRST_BUY | 첫구매 발급 |
| DORMANT | 장기미접속 발급 |
> 적용: `pm_coupon.coupon_issue_type_cd`

#### COUPON_STATUS — 쿠폰상태
| code_value | label |
|---|---|
| ACTIVE | 활성 |
| INACTIVE | 비활성 |
| EXPIRED | 만료 |
> 적용: `pm_coupon.coupon_status_cd`

#### DISCNT_TYPE — 할인유형
| code_value | label |
|---|---|
| RATE | 정률할인 |
| FIXED | 정액할인 |
| FREE_SHIP | 무료배송 |
> 적용: `pm_discnt.discnt_type_cd`

#### DISCNT_STATUS — 할인상태
| code_value | label |
|---|---|
| ACTIVE | 활성 |
| INACTIVE | 비활성 |
| EXPIRED | 만료 |
> 적용: `pm_discnt.discnt_status_cd`

#### DISCNT_TARGET — 할인적용대상
| code_value | label |
|---|---|
| ALL | 전체 |
| CATEGORY | 카테고리 |
| PRODUCT | 상품 |
| MEMBER_GRADE | 회원등급 |
> 적용: `pm_discnt.discnt_target_cd`, `pm_discnt_item.target_type_cd`

#### GIFT_TYPE — 사은품유형
| code_value | label |
|---|---|
| PRODUCT | 상품 |
| SAMPLE | 샘플 |
| ETC | 기타 |
> 적용: `pm_gift.gift_type_cd`

#### GIFT_STATUS — 사은품상태
| code_value | label |
|---|---|
| ACTIVE | 활성 |
| INACTIVE | 비활성 |
> 적용: `pm_gift.gift_status_cd`

#### GIFT_COND_TYPE — 사은품 지급 조건유형
| code_value | label |
|---|---|
| ORDER_AMT | 주문금액 기준 |
| PRODUCT | 특정 상품 포함 |
| MEMBER_GRADE | 회원등급 기준 |
> 적용: `pm_gift_cond.cond_type_cd`

#### GIFT_ISSUE_STATUS — 사은품발급상태
| code_value | label | 설명 |
|---|---|---|
| ISSUED | 발급됨 | 사은품 발급, 배송 전 |
| DELIVERED | 배송완료 | 함께 배송 완료 |
| CANCELLED | 취소 | 주문 취소로 발급 취소 |
> 적용: `pm_gift_issue.gift_issue_status_cd`

#### SAVE_TYPE — 적립금 유형
| code_value | label |
|---|---|
| EARN | 적립 |
| USE | 사용 |
| EXPIRE | 소멸 |
| CANCEL | 적립 취소 |
| ADMIN | 관리자 조정 |
> 적용: `pm_save_hist.save_type_cd`

#### SAVE_ISSUE_TYPE — 적립금 발생사유
| code_value | label |
|---|---|
| JOIN | 회원가입 |
| ORDER_COMPLT | 구매확정 |
| REVIEW_TEXT | 텍스트 후기 |
| REVIEW_PHOTO | 포토 후기 |
| REVIEW_VIDEO | 동영상 후기 |
| EVENT | 이벤트 |
| BIRTHDAY | 생일 |
| REFERRAL | 친구 초대 |
| ADMIN_GRANT | 관리자 지급 |
| ADMIN_REVOKE | 관리자 회수 |
| ORDER_CANCEL | 주문취소/반품 복원 |
| EXPIRE | 유효기간 만료 |
| CLAIM_SHIP | 클레임 배송비 |
> 적용: `pm_save_hist.save_issue_type_cd`

#### SAVE_ISSUE_STATUS — 적립금발급상태
| code_value | label |
|---|---|
| SCHEDULED | 적립예정 |
| COMPLETED | 적립완료 |
| CANCELLED | 취소 |
| EXPIRED | 소멸 |
> 적용: `pm_save_hist.issue_status_cd`

#### EVENT_STATUS — 이벤트상태
| code_value | label |
|---|---|
| DRAFT | 임시저장 |
| WAITING | 대기중 |
| ACTIVE | 진행중 |
| PAUSED | 중지 |
| ENDED | 종료 |
> 적용: `pm_event.event_status_cd`

#### EVENT_TYPE — 이벤트유형
| code_value | label |
|---|---|
| SURVEY | 설문 |
| STAMP | 스탬프 |
| RAFFLE | 추첨 |
| COUPON | 쿠폰지급 |
| REVIEW | 후기이벤트 |
| SHARE | 공유이벤트 |
> 적용: `pm_event.event_type_cd`

#### CACHE_TYPE — 캐시(충전금) 유형
| code_value | label |
|---|---|
| CHARGE | 충전 |
| USE | 사용 |
| REFUND | 환불 |
| EXPIRE | 소멸 |
| ADJ | 관리자 조정 |
> 적용: `pm_cache_hist.cache_type_cd`

#### VOUCHER_TYPE — 상품권유형
| code_value | label |
|---|---|
| AMOUNT | 금액권 |
| PRODUCT | 상품교환권 |
> 적용: `pm_voucher.voucher_type_cd`

#### VOUCHER_STATUS — 상품권상태
| code_value | label |
|---|---|
| ACTIVE | 활성 |
| USED | 사용완료 |
| EXPIRED | 만료 |
| CANCELLED | 취소 |
> 적용: `pm_voucher.voucher_status_cd`

#### VOUCHER_ISSUE_STATUS — 상품권발급상태
| code_value | label |
|---|---|
| ISSUED | 발급됨 |
| USED | 사용완료 |
| CANCELLED | 취소 |
| EXPIRED | 만료 |
> 적용: `pm_voucher_issue.issue_status_cd`

#### PLAN_STATUS — 기획전상태
| code_value | label |
|---|---|
| DRAFT | 임시저장 |
| ACTIVE | 진행중 |
| ENDED | 종료 |
| INACTIVE | 비활성 |
> 적용: `pm_plan.plan_status_cd`

#### PLAN_TYPE — 기획전유형
| code_value | label |
|---|---|
| GENERAL | 일반기획전 |
| BRAND | 브랜드기획전 |
| SEASON | 시즌기획전 |
| SALE | 세일기획전 |
> 적용: `pm_plan.plan_type_cd`

#### PROMO_TARGET_TYPE — 프로모션 대상유형
| code_value | label |
|---|---|
| ALL | 사이트 전체 |
| PRODUCT | 상품 지정 |
| CATEGORY | 카테고리 지정 |
| VENDOR | 업체 지정 |
| BRAND | 브랜드 지정 |
| MEMBER_GRADE | 회원등급 |
> 적용: `pm_coupon_item.target_type_cd`, `pm_event_item.target_type_cd`

#### BENEFIT_TYPE — 혜택유형
| code_value | label |
|---|---|
| COUPON | 쿠폰 |
| SAVE | 적립금 |
| CACHE | 캐시 |
| GIFT | 사은품 |
| DISCOUNT | 즉시할인 |
> 적용: `pm_event_benefit.benefit_type_cd`

---

### 전시 (DP)

#### DEVICE_TYPE — 디바이스유형
| code_value | label |
|---|---|
| PC | PC 브라우저 |
| MOBILE | 모바일 브라우저 |
| APP | 모바일 앱 |
| ALL | 전체 |
> 적용: `dp_ui.device_type_cd`

#### DISP_AREA_TYPE — 전시영역유형
| code_value | label | 설명 |
|---|---|---|
| FULL | 전체폭 | 화면 전체 너비 |
| SIDEBAR | 사이드바 | 좌우 사이드 영역 |
| POPUP | 팝업 | 레이어 팝업 |
| INLINE | 인라인 | 콘텐츠 내 삽입 영역 |
> 적용: `dp_area.area_type_cd`

#### DISP_TYPE — 전시유형 (패널)
| code_value | label |
|---|---|
| MAIN_BANNER | 메인배너 |
| SUB_BANNER | 서브배너 |
| POPUP | 팝업 |
| SPECIAL | 기획전 |
| PRODUCT_LIST | 상품목록 |
| CONTENT | 콘텐츠 |
> 적용: `dp_panel.panel_type_cd`

#### DISP_STATUS — 전시상태
| code_value | label |
|---|---|
| ACTIVE | 활성 |
| INACTIVE | 비활성 |
> 적용: `dp_panel.disp_panel_status_cd`, `sy_notice.notice_status_cd`

#### WIDGET_TYPE — 위젯유형
| code_value | label |
|---|---|
| image_banner | 이미지 배너 |
| product_slider | 상품 슬라이더 |
| product | 상품 |
| cond_product | 조건상품 |
| chart_bar | 차트 (Bar) |
| chart_line | 차트 (Line) |
| chart_pie | 차트 (Pie) |
| text_banner | 텍스트 배너 |
| info_card | 정보 카드 |
| popup | 팝업 |
| file | 파일 |
| file_list | 파일목록 |
| coupon | 쿠폰 |
| html_editor | HTML 에디터 |
| event_banner | 이벤트 |
| cache_banner | 캐쉬 |
| widget_embed | 위젯 임베드 |
| barcode | 바코드 |
| countdown | 카운트다운 |
| markdown | Markdown |
| video_player | 동영상 플레이어 |
| map_widget | 지도맵 |
> 적용: `dp_panel_item.widget_type_cd`, `dp_widget_lib.widget_type_cd`

#### CONTENT_TYPE — 콘텐츠유형 (패널항목)
| code_value | label |
|---|---|
| WIDGET | 위젯 |
| HTML | HTML 직접입력 |
| TEXT | 텍스트 |
| IMAGE | 이미지 |
> 적용: `dp_panel_item.content_type_cd`

#### VISIBILITY_TARGET — 공개대상
| code_value | label | 설명 |
|---|---|---|
| PUBLIC | 전체 공개 | 비회원 포함 전체 |
| MEMBER | 회원 | 로그인 회원 |
| SILVER | 실버↑ | 실버 등급 이상 |
| GOLD | 골드↑ | 골드 등급 이상 |
| VIP | VIP | VIP 전용 |
| STAFF | 직원 | 내부 직원 |
> 적용: `dp_panel.visibility_targets`, `dp_panel_item.visibility_targets` (^CODE^CODE^ 다중값 형식)

---

### 정산 (ST)

#### SETTLE_STATUS — 정산상태
| code_value | label |
|---|---|
| OPEN | 진행중 |
| CLOSED | 마감완료 |
| CANCELLED | 마감취소 |
> 적용: `st_settle.settle_status_cd`

#### SETTLE_CLOSE_STATUS — 정산마감상태
| code_value | label |
|---|---|
| DRAFT | 임시마감 |
| CONFIRMED | 확정마감 |
| PAID | 지급완료 |
> 적용: `st_settle_close.close_status_cd`

#### SETTLE_PAY_STATUS — 정산지급상태
| code_value | label |
|---|---|
| PENDING | 지급대기 |
| REQUESTED | 지급요청 |
| COMPLT | 지급완료 |
| FAILED | 지급실패 |
| DISPUTED | 이의신청 |
> 적용: `st_settle_pay.settle_pay_status_cd`

#### SETTLE_CYCLE — 정산주기
| code_value | label |
|---|---|
| WEEKLY | 주간정산 |
| BIWEEKLY | 격주정산 |
| MONTHLY | 월간정산 |
> 적용: `st_settle_config.settle_cycle_cd`

#### SETTLE_ITEM_TYPE — 정산항목유형
| code_value | label |
|---|---|
| SALE | 판매 |
| CANCEL | 취소/반품 |
| DISCNT | 할인분담 |
| GIFT | 사은품분담 |
| SHIP | 배송비 |
| ADJ | 조정 |
> 적용: `st_settle_item.settle_item_type_cd`

#### SETTLE_ADJ_TYPE — 정산조정유형
| code_value | label |
|---|---|
| PENALTY | 패널티 |
| BONUS | 보너스 |
| ERROR_FIX | 오류수정 |
| OTHER | 기타 |
> 적용: `st_settle_adj.adj_type_cd`, `st_settle_etc_adj.etc_adj_type_cd`

#### ADJ_DIR — 조정방향
| code_value | label |
|---|---|
| ADD | 가산 |
| SUB | 차감 |
> 적용: `st_settle_etc_adj.etc_adj_dir_cd`

#### RAW_STATUS — 수집원장상태
| code_value | label |
|---|---|
| COLLECTED | 수집완료 |
| EXCLUDED | 제외 |
| SETTLED | 정산반영 |
> 적용: `st_settle_raw.raw_status_cd`

#### RAW_TYPE — 수집원장유형
| code_value | label |
|---|---|
| ORDER | 주문 |
| CLAIM | 클레임 |
| ADJ | 조정 |
> 적용: `st_settle_raw.raw_type_cd`

#### RECON_STATUS — 대사상태
| code_value | label |
|---|---|
| MATCHED | 일치 |
| DIFF | 차이 |
| MANUAL | 수동처리 |
> 적용: `st_recon.recon_status_cd`

#### RECON_TYPE — 대사유형
| code_value | label |
|---|---|
| ORDER | 주문 대사 |
| SETTLE | 정산 대사 |
> 적용: `st_recon.recon_type_cd`

#### ERP_VOUCHER_TYPE — ERP전표유형
| code_value | label |
|---|---|
| SALE | 매출전표 |
| CANCEL | 취소전표 |
| SETTLE | 정산전표 |
| ADJ | 조정전표 |
> 적용: `st_erp_voucher.erp_voucher_type_cd`

#### ERP_VOUCHER_STATUS — ERP전표상태
| code_value | label |
|---|---|
| DRAFT | 임시 |
| SENT | 전송완료 |
| FAILED | 전송실패 |
| CONFIRMED | ERP확인 |
> 적용: `st_erp_voucher.erp_voucher_status_cd`

---

### 시스템 (SY)

#### SITE_STATUS — 사이트상태
| code_value | label |
|---|---|
| ACTIVE | 운영중 |
| MAINTENANCE | 점검중 |
| INACTIVE | 비활성 |
> 적용: `sy_site.site_status_cd`

#### SITE_TYPE — 사이트유형
| code_value | label | 설명 |
|---|---|---|
| EC | 이커머스 | 사용자 쇼핑 사이트 |
| ADMIN | 관리자 | 관리자 운영 사이트 |
| API | API | API 전용 사이트 (서버간 통신) |
> 적용: `sy_site.site_type_cd`

#### USER_STATUS — 관리자상태
| code_value | label | 설명 |
|---|---|---|
| ACTIVE | 활성 | 정상 로그인·업무 가능 |
| DORMANT | 휴면 | 90일 이상 미접속. 비밀번호 재설정 필요 |
| SUSPENDED | 정지 | 정책 위반으로 관리자 정지 |
| DELETED | 삭제 | 퇴직·계정 삭제. 이력 보존, 로그인 불가 |
> 적용: `sy_user.user_status_cd`

#### VENDOR_STATUS — 업체상태
| code_value | label | 설명 |
|---|---|---|
| PENDING | 대기 | 등록 심사 대기 |
| APPROVED | 승인 | 심사 승인. 상품 등록·판매 가능 |
| SUSPENDED | 정지 | 일시 정지. 상품 노출·주문 차단 |
| CLOSED | 종료 | 계약 종료. 기존 주문 처리만 가능 |
> 적용: `sy_vendor.vendor_status_cd`

#### VENDOR_TYPE — 업체유형
| code_value | label |
|---|---|
| BRAND | 브랜드사 |
| AGENT | 에이전트 |
| DIRECT | 직매입 |
| CONSIGN | 위탁판매 |
> 적용: `sy_vendor.vendor_type_cd`, `st_settle_raw.vendor_type_cd`

#### BRAND_CONTRACT — 브랜드계약유형
| code_value | label |
|---|---|
| EXCLUSIVE | 독점계약 |
| NON_EXCLUSIVE | 비독점계약 |
| CONSIGN | 위탁계약 |
> 적용: `sy_vendor_brand.contract_cd`

#### VENDOR_CLASS — 업체분류 (사업자유형)
| code_value | label |
|---|---|
| INDIVIDUAL | 개인사업자 |
| CORPORATION | 법인사업자 |
| TAX_EXEMPT | 면세사업자 |
| SIMPLIFIED | 간이과세자 |
> 적용: `sy_vendor.vendor_class_cd`

#### VENDOR_CONTENT_TYPE — 업체콘텐츠유형
| code_value | label |
|---|---|
| INTRO | 업체소개 |
| POLICY | 정책/규정 |
| NOTICE | 공지사항 |
> 적용: `sy_vendor_content.content_type_cd`

#### VENDOR_CONTENT_STATUS — 업체콘텐츠상태
| code_value | label |
|---|---|
| DRAFT | 임시저장 |
| ACTIVE | 게시중 |
| INACTIVE | 비게시 |
> 적용: `sy_vendor_content.vendor_content_status_cd`

#### VENDOR_USER_STATUS — 업체직원상태
| code_value | label |
|---|---|
| ACTIVE | 재직 |
| LEFT | 퇴직 |
| SUSPENDED | 정지 |
> 적용: `sy_vendor_user.vendor_user_status_cd`

#### POSITION — 업체직원직위
| code_value | label |
|---|---|
| CEO | 대표 |
| DIRECTOR | 이사 |
| MANAGER | 팀장 |
| EMPLOYEE | 담당자 |
> 적용: `sy_vendor_user.position_cd`

#### ALARM_TYPE — 알림유형
| code_value | label |
|---|---|
| ORDER | 주문알림 |
| CLAIM | 클레임알림 |
| SYSTEM | 시스템알림 |
| MARKETING | 마케팅알림 |
> 적용: `sy_alarm.alarm_type_cd`

#### ALARM_CHANNEL — 알림채널
| code_value | label |
|---|---|
| EMAIL | 이메일 |
| SMS | SMS |
| PUSH | 앱푸시 |
| KAKAO | 카카오알림톡 |
> 적용: `sy_alarm.alarm_channel_cd`, `sy_alarm_send_hist.alarm_channel_cd`

#### ALARM_TARGET_TYPE — 알림대상유형
| code_value | label |
|---|---|
| MEMBER | 회원 |
| VENDOR | 업체 |
| ADMIN | 관리자 |
| ALL | 전체 |
> 적용: `sy_alarm.alarm_target_type_cd`

#### ALARM_STATUS — 알림발송상태
| code_value | label | 설명 |
|---|---|---|
| PENDING | 대기 | 발송 예정. 발송 시각 미도달 |
| SENT | 발송됨 | 발송 완료 |
| FAILED | 실패 | 발송 실패. fail_count 누적 |
| CANCELLED | 취소 | 관리자 수동 취소 |
> 적용: `sy_alarm.alarm_status_cd`

#### TEMPLATE_TYPE — 템플릿유형
| code_value | label |
|---|---|
| EMAIL | 이메일 |
| SMS | SMS |
| PUSH | 앱푸시 |
| KAKAO | 카카오알림톡 |
> 적용: `sy_template.template_type_cd`

#### SEND_RESULT — 발송결과
| code_value | label |
|---|---|
| SUCCESS | 성공 |
| FAILED | 실패 |
| PENDING | 대기 |
> 적용: `sy_alarm_send_hist.send_hist_status_cd`, `sy_send_email_log.result_cd`, `sy_send_msg_log.result_cd`

#### BATCH_CYCLE — 배치주기
| code_value | label |
|---|---|
| HOURLY | 시간별 |
| DAILY | 일별 |
| WEEKLY | 주별 |
| MONTHLY | 월별 |
| MANUAL | 수동 |
> 적용: `sy_batch.batch_cycle_cd`

#### BATCH_STATUS — 배치상태
| code_value | label |
|---|---|
| ACTIVE | 활성 |
| INACTIVE | 비활성 |
> 적용: `sy_batch.batch_status_cd`

#### CONTACT_STATUS — 1:1 문의상태
| code_value | label |
|---|---|
| PENDING | 대기 |
| ANSWERED | 답변완료 |
| CLOSED | 종료 |
> 적용: `sy_contact.contact_status_cd`

#### CONTACT_CATEGORY — 문의유형
| code_value | label |
|---|---|
| ORDER | 주문 |
| DLIV | 배송 |
| PRODUCT | 상품 |
| CLAIM | 클레임 |
| OTHER | 기타 |
> 적용: `sy_contact.category_cd`

#### NOTICE_TYPE — 공지유형
| code_value | label |
|---|---|
| GENERAL | 일반공지 |
| EVENT | 이벤트 |
| SERVICE | 서비스 |
| SYSTEM | 시스템 |
> 적용: `sy_notice.notice_type_cd`

#### BBM_TYPE — BBM유형 (팝업·공지)
| code_value | label |
|---|---|
| NORMAL | 일반팝업 |
| NOTICE | 공지팝업 |
| EVENT | 이벤트팝업 |
| COOKIE | 쿠키팝업 |
> 적용: `sy_bbm.bbm_type_cd`

#### SCOPE_TYPE — 노출범위 (팝업·공지)
| code_value | label |
|---|---|
| ALL | 전체 (비회원 포함) |
| MEMBER | 회원 전용 |
| ADMIN | 관리자 화면 전용 |
> 적용: `sy_bbm.scope_type_cd`

#### BBS_STATUS — 게시글상태
| code_value | label |
|---|---|
| ACTIVE | 활성 |
| HIDDEN | 숨김 |
| DELETED | 삭제 |
> 적용: `sy_bbs.bbs_status_cd`

#### DEPT_TYPE — 부서유형
| code_value | label |
|---|---|
| HEAD | 본부 |
| DEPT | 부서 |
| TEAM | 팀 |
> 적용: `sy_dept.dept_type_cd`

#### MENU_TYPE — 메뉴유형
| code_value | label |
|---|---|
| PAGE | 페이지 메뉴 (컴포넌트 렌더) |
| FOLDER | 폴더 (하위 메뉴 묶음) |
| LINK | 외부링크 |
> 적용: `sy_menu.menu_type_cd`

#### ROLE_TYPE — 역할유형
| code_value | label | 설명 |
|---|---|---|
| SUPER | 슈퍼관리자 | 전체 권한. 시스템 설정 포함 |
| ADMIN | 관리자 | 일반 운영 권한 |
| VENDOR | 업체담당자 | 담당 업체 상품·주문만 접근 |
| CS | 고객센터 | 회원·주문·클레임 조회·처리 |
| VIEWER | 조회자 | 읽기 전용 |
> 적용: `sy_role.role_type_cd`

#### PROP_TYPE — 속성유형
| code_value | label |
|---|---|
| STRING | 문자열 |
| NUMBER | 숫자 |
| BOOLEAN | Y/N |
| JSON | JSON |
> 적용: `sy_prop.prop_type_cd`

#### TOKEN_TYPE — 토큰유형
| code_value | label |
|---|---|
| ACCESS | 액세스 토큰 |
| REFRESH | 리프레시 토큰 |
| TEMP | 임시 토큰 |
> 적용: `sy_user_token_log.token_type_cd`, `mb_member_token_log.token_type_cd`

#### MEDIA_TYPE — 미디어유형
| code_value | label |
|---|---|
| IMAGE | 이미지 |
| VIDEO | 동영상 |
| DOCUMENT | 문서 |
> 적용: `sy_attach.media_type_cd`, `pd_review_attach.media_type_cd`

#### MIME_TYPE — MIME유형 (첨부파일 카테고리)
| code_value | label |
|---|---|
| IMAGE | 이미지 (image/*) |
| VIDEO | 동영상 (video/*) |
| DOCUMENT | 문서 (application/pdf 등) |
| TEXT | 텍스트 (text/*) |
| APPLICATION | 응용프로그램 (application/*) |
> 적용: `sy_attach.mime_type_cd`

#### VOC_MASTER — VOC 마스터 분류
| code_value | label |
|---|---|
| DELIVERY | 배송 |
| PRODUCT | 상품 |
| PAYMENT | 결제 |
| CLAIM | 클레임 |
| SERVICE | 서비스 |
| ETC | 기타 |
> 적용: `sy_voc.voc_master_cd`

#### I18N_SCOPE — 다국어 적용범위
| code_value | label | 설명 |
|---|---|---|
| FO | 프론트 전용 | 사용자 페이스 전용 키 |
| BO | 관리자 전용 | 백오피스 전용 키 |
| COMMON | 공통 | FO·BO 공용 키 |
> 적용: `sy_i18n.i18n_scope_cd`

#### LANG_CODE — 언어코드
| code_value | label | 비고 |
|---|---|---|
| ko | 한국어 | 기본 언어 |
| en | 영어 | 필수 |
| ja | 일본어 | 선택 |
| in | 인도네시아어 | 선택 |
> 적용: `sy_i18n_msg.lang_cd`

#### VOC_DETAIL — VOC 세부 분류
| code_value | label |
|---|---|
| DELIVERY_DELAY | 배송지연 |
| DELIVERY_LOST | 배송분실 |
| DELIVERY_DAMAGE | 배송파손 |
| PRODUCT_DEFECT | 상품불량 |
| PRODUCT_WRONG | 오배송 |
| PRODUCT_INFO | 상품정보 오류 |
| PAYMENT_FAIL | 결제실패 |
| PAYMENT_REFUND | 환불요청 |
| CLAIM_CANCEL | 취소처리 |
| CLAIM_RETURN | 반품처리 |
| CLAIM_EXCHANGE | 교환처리 |
| SERVICE_MEMBER | 회원서비스 |
| ETC | 기타 |
> 적용: `sy_voc.voc_detail_cd`

---

## 관련 테이블
- `sy_code_grp`: 코드 그룹
- `sy_code`: 공통코드 항목

## 주요 필드 (sy_code)
| 필드 | 설명 |
|------|------|
| code_id | 코드ID (YYMMDDhhmmss+rand4) |
| code_grp | 코드그룹 (sy_code_grp.code_grp) |
| code_value | 코드값 (저장값) |
| code_label | 코드라벨 (화면 표시) |
| sort_ord | 정렬순서 |
| use_yn | 사용여부 Y/N |

## 제약사항
- SYSTEM코드는 개발팀 승인 없이 수정 불가
- 사용중인 코드는 즉시 폐기 불가
- `*_cd` 컬럼에 사용되는 코드값은 반드시 이 문서에 정의되어야 함
- 코드그룹명은 DDL에서 대표 사용하는 컬럼명에서 `_cd` 제거 후 대문자화

## 변경이력
- 2026-04-19: DDL 전수조사 기반 코드값 불일치 수정 및 신규 코드그룹 추가 (전체 116개 `_cd` 컬럼 완전 반영)
  - **수정** (DDL 기준 재정의): AUTH_METHOD(소셜로그인 방법으로), SITE_TYPE(EC/ADMIN/API), USER_STATUS(DORMANT/DELETED 추가), VENDOR_STATUS(PENDING/APPROVED/CLOSED), VENDOR_CLASS(사업자유형으로), BBM_TYPE(팝업유형으로), SCOPE_TYPE(BBM_SCOPE_TYPE 개명+값 변경), MENU_TYPE(FOLDER로 통일), ROLE_TYPE(역할별 5종으로)
  - **추가**: VENDOR_USER_STATUS, POSITION, ALARM_STATUS, CONTACT_CATEGORY, BBS_STATUS, REFUND_TYPE, FAULT_TYPE
- 2026-04-18: 다국어(i18n) 코드 추가 — I18N_SCOPE, LANG_CODE (sy_i18n·sy_i18n_msg 신규 테이블 대응)
- 2026-04-18: 전체 DDL `_cd` 컬럼 전수조사 반영 — 전시(DP) 전체 추가, 정산(ST) 추가, 결제구분/방향/발생유형 추가, 클레임항목상태·결재상태·사은품발급상태 추가, 각 코드그룹별 적용 테이블·컬럼 표시
- 2026-04-18: ec2_code.txt 참고하여 전면 재작성
- 2026-04-16: 초기 작성
