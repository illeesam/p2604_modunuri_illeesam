# 931. DDL 단어사전 및 명명 규칙

## 목적
모든 DDL 설계에서 컬럼명, 테이블명, 코드명의 표준화 및 일관성 유지

## 범위
- PostgreSQL DDL 작성 규칙
- 컬럼명 명명 표준
- 코드 체계 정의
- 약어 통일

## 필수 명명 규칙

### 1. PRIMARY KEY
- **형식**: 항상 `테이블명_id`
- **생성**: UUID 또는 TIMESTAMP+Random
- **제약**: 복합 PK 금지, UNIQUE INDEX로 구성
- **예시**: `site_id`, `user_id`, `order_id`, `code_grp_id`

### 2. 금액 관련
- **규칙**: "금액"으로 끝나는 컬럼 → `*_amt` 접미사
- **제약**: 단독 `amt` 금지, 반드시 복합어
- **예시**: `refund_amt`, `discnt_amt`, `cache_amt`, `balance_amt`

### 3. 재고 관련
- **규칙**: "재고"로 끝나는 컬럼 → `*_stock` 접미사
- **제약**: 단독 `stock` 금지, 반드시 복합어
- **예시**: `prod_stock`, `prod_opt_stock`

### 4. 수량 관련
- **규칙**: "수량"으로 끝나는 컬럼 → `*_qty` 접미사
- **제약**: 단독 `qty` 금지, 반드시 복합어
- **예시**: `order_qty`, `claim_qty`, `stock_qty`

### 5. 가격 관련
- **규칙**: `price` 단독 사용 금지, 반드시 수식어 필수
- **예시**: `list_price` (정가), `sale_price` (판매가), `unit_price` (단가), `item_price` (소계)

### 6. 코드형 컬럼
- **규칙**: `테이블명_status_cd` 또는 `[도메인_][엔티티_]상태명_cd`
- **형식**: `*_status_cd`, `*_type_cd`, `*_method_cd` 등
- **예시**: `order_status_cd`, `member_status_cd`, `pay_method_cd`, `refund_method_cd`
- **FK 참조**: `*_cd`로 끝나는 컬럼명 사용

### 7. 설명 컬럼
- **규칙**: `description` 대신 `entity_desc` 패턴 사용
- **제약**: 단독 `desc` 금지, 반드시 복합어
- **예시**: `product_desc`, `category_desc`, `coupon_desc`, `event_desc`

### 8. 제목/내용
- **규칙**: `title/content` 단독 금지 → `entity_title`, `entity_content` 패턴
- **예시**: `review_title`, `review_content`, `blog_comment_content`, `push_log_title`

### 9. 기본정보 (이름/전화/이메일/주소 등)
- **규칙**: 단독 사용 금지, 반드시 복합어 (entity_*)
- **제약**: name, phone, email, password, gender, addr, memo 등 단독 금지
- **예시**: 
  - `member_nm`, `user_phone`, `member_email`
  - `member_password`, `member_gender`, `member_addr`, `member_zip_code`
  - `site_phone`, `site_email`, `site_address`

### 10. 결재 컬럼
- **규칙**: `approval` 대신 `appr` 사용
- **예시**: `appr_status_cd`, `appr_amt`, `appr_reason`, `appr_req_user_id`, `appr_aprv_user_id`

### 11. 계층/깊이
- **규칙**: `depth` 대신 `테이블명_depth` 사용
- **예시**: `category_depth` (depth 불가)

### 12. 발신자
- **규칙**: `sender` 대신 `sender_cd` 사용 (코드형)
- **예시**: `sender_cd` (MEMBER/ADMIN)

---

## 단어 약어 정의

### 기본 약어
| 약어 | 한글명 | 사용규칙 | 예시 |
|------|--------|---------|------|
| id | 아이디 (식별자) | 필수 | site_id, user_id, order_id |
| nm | 이름/명칭 | 복합어만 | member_nm, prod_nm, user_nm |
| cd | 코드 | 복합어, _cd 접미사 | order_status_cd, pay_method_cd |
| no | 번호 | 복합어만 | order_no, contact_no |
| yn | 여부 | Y/N 값 | use_yn, visible_yn |
| cnt | 건수/개수 | 복합어만 | sale_cnt, view_cnt |
| qty | 수량 | 복합어만 | order_qty, claim_qty, stock_qty |
| amt | 금액 | 복합어만 | cache_amt, refund_amt, discnt_amt |
| price | 가격 | 복합어만 | list_price, sale_price, unit_price |
| stock | 재고 | 복합어만 | prod_stock, prod_opt_stock |
| title | 제목 | 복합어만 | event_title, review_title |
| content | 내용 | 복합어만 | event_content, review_content |
| name | 이름 | 복합어만 (name 대신 nm) | member_nm, prod_nm |
| phone | 전화 | 복합어만 | member_phone, user_phone |
| email | 이메일 | 복합어만 | member_email, user_email |
| password | 비밀번호 | 복합어만 | member_password, user_password |
| gender | 성별 | 복합어만 | member_gender, user_gender |
| addr | 주소 | 복합어만 | member_addr, user_addr |
| addr_detail | 상세주소 | 복합어만 | member_addr_detail |
| zip_code | 우편번호 | 복합어만 | member_zip_code, site_zip_code |
| memo | 메모 | 복합어만 | chatt_memo, order_memo |
| subject | 주제/제목 | 복합어만 | template_subject, contact_subject |
| answer | 답변 | 복합어만 | contact_answer, faq_answer |
| remark | 비고 | 복합어만 | code_remark, brand_remark |
| msg | 메시지 | 복합어만 | alarm_msg, error_msg |
| desc | 설명 | 복합어만 | product_desc, category_desc |
| rate | 비율 (%) | - | - |
| ord | 순서 (정렬) | sort_ord | sort_ord |
| dt | 일자 (DATE형) | - | - |
| date | 일시 (TIMESTAMP형) | - | order_date, reg_date |
| url | URL 경로 | - | - |
| html | HTML 내용 | - | - |
| method_cd | 수단/방식 | 코드형 필수 | pay_method_cd, refund_method_cd, auth_method_cd |
| grp | 그룹 | - | - |
| val | 값 | - | - |
| key | 키 | - | - |
| code | 코드값 (문자) | - | - |
| info | 정보 | - | - |
| use | 사용 | - | - |
| reg | 등록 | - | - |
| upd | 수정/업데이트 | - | - |
| del | 삭제 | - | - |
| proc | 처리 | - | - |
| chg | 변경 | - | - |
| req | 요청 | - | - |
| res | 응답 | - | - |
| log | 로그 | - | - |
| hist | 이력 | - | - |
| snap | 스냅샷 | - | - |
| path | 경로 | - | - |
| disp_path | 표시경로 | 전시/프로퍼티 트리용 점(.) 구분 경로 | FRONT.모바일메인 |
| appr | 결재/결재처리 | approval 대신 사용 | appr_status_cd, appr_amt |
| aprv | 결재(승인) | - | appr_aprv_user_id |
| prop | 프로퍼티 | - | - |
| target | 대상 | - | - |
| reason | 사유 | - | - |
| by | 처리자 ID | FK sy_user.user_id | reg_by, upd_by, appr_aprv_user_id |

### *_log 테이블 예외 약어 (단독 사용 허용)
| 약어 | 설명 |
|------|------|
| ip | IP 주소 |
| device | 장치 (User-Agent) |
| os | 운영체제 |
| browser | 브라우저 |
| country | 국가 |
| referrer | 유입경로 URL |
| token | 토큰 |
| access_token | 액세스 토큰 |
| refresh_token | 리프레시 토큰 |
| prev_token | 이전 토큰 |
| revoke_reason | 폐기 사유 |
| token_exp | 토큰 만료일시 |
| api_nm | API명 |
| req_body | 요청 본문 |
| res_body | 응답 본문 |
| http_status | HTTP 상태코드 |
| error_msg | 오류 메시지 |
| elapsed_ms | 응답시간(ms) |
| call_date | 호출 일시 |
| view_date | 조회 일시 |

> *_hist 테이블: 원본 컬럼명 + 단독어 추가 허용

---

## 도메인 접두사

| 접두사 | 도메인 | 예시 |
|--------|--------|------|
| sy_ | 시스템 (공통/관리) | sy_site, sy_user, sy_code |
| cm_ | 커뮤니티 공통 | cm_bltn, cm_chatt_msg, cm_push_log |
| mb_ | 회원 | mb_member, mb_like, mb_member_addr |
| od_ | 주문 | od_order, od_dliv, od_claim, od_pay |
| pd_ | 상품 | pd_prod, pd_category, pd_review |
| pm_ | 프로모션 | pm_coupon, pm_cache, pm_event |
| dp_ | 전시 | dp_ui, dp_area, dp_panel, dp_widget |
| st_ | 정산 | st_settle_config, st_settle, st_settle_raw, st_settle_item, st_settle_adj, st_settle_close, st_settle_pay, st_recon, st_erp_voucher, st_erp_voucher_line |

---

## 주요 엔티티 약어

| 약어 | 한글명 |
|------|--------|
| site | 사이트 |
| user | 관리자 사용자 |
| dept | 부서 |
| role | 역할 |
| menu | 메뉴 |
| brand | 브랜드 |
| vendor | 업체/공급사 |
| member | 회원 (고객) |
| prod | 상품 |
| category | 카테고리 |
| opt | 옵션 |
| sku | SKU (재고관리단위) |
| img | 이미지 |
| cart | 장바구니 |
| order | 주문 |
| order_item | 주문상품 |
| pay | 결제 |
| dliv | 배송 |
| dliv_item | 배송항목 |
| claim | 클레임 (취소/반품/교환) |
| claim_item | 클레임항목 |
| coupon | 쿠폰 |
| issue | 발급 |
| usage | 사용이력 |
| cache | 적립금 |
| review | 리뷰 |
| media | 미디어 (이미지/동영상) |
| reply | 댓글 |
| event | 이벤트 |
| notice | 공지사항 |
| contact | 문의 |
| chatt | 채팅 |
| disp | 전시 |
| panel | 패널 |
| widget | 위젯 |
| attach | 첨부파일 |
| batch | 배치 |
| alarm | 알림 |
| bbs | 게시판 |
| bbm | 게시판 메시지 |
| template | 템플릿 |
| code | 공통코드 |
| prop | 프로퍼티 (sy_prop) |
| discnt | 할인 (pm_discnt) |
| save | 적립금 지급/사용 (pm_save) |
| gift | 사은품 (pm_gift) |
| voucher | 상품권 (pm_voucher) |
| plan | 기획전 (pm_plan) |
| settle_raw | 정산수집원장 (st_settle_raw) |
| settle | 정산집계 (st_settle) |
| settle_config | 정산기준 (st_settle_config) |
| settle_adj | 정산조정 (st_settle_adj) |
| settle_etc_adj | 정산기타조정 (st_settle_etc_adj) |
| settle_close | 정산마감 (st_settle_close) |
| settle_pay | 정산지급 (st_settle_pay) |
| recon | 정산대사 (st_recon) |
| erp_voucher | ERP 전표 (st_erp_voucher) |
| erp_voucher_line | ERP 전표 라인 (st_erp_voucher_line) |

---

## 금액/결제 관련 약어

| 약어 | 한글명 |
|------|--------|
| list_price | 정가 (원래가격) |
| unit_price | 단가 |
| sale_price | 판매가 |
| item_price | 소계 (unit_price × order_qty) |
| total_purchase_amt | 누적 구매금액 |
| total_price | 합계금액 |
| pay_price | 실결제금액 |
| discnt_amt | 할인금액 |
| coupon_discnt_amt | 쿠폰할인금액 |
| refund_amt | 환불금액 |
| add_price | 옵션 추가금액 |
| min_order_amt | 최소주문금액 |
| max_discnt_amt | 최대할인한도 |
| cache_amt | 적립금 금액 (양수:적립/음수:사용) |
| balance_amt | 잔액 (처리 후 계산 잔액) |
| cache_balance_amt | 적립금 잔액 (누적) |
| pay_method_cd | 결제수단 |

## 주소/연락처 관련 약어

| 약어 | 한글명 |
|------|--------|
| zip | 우편번호 |
| addr | 주소 |
| addr_detail | 상세주소 |
| phone | 연락처 (전화번호) |
| email | 이메일 |
| recv | 수령자 (수취인) |

---

## 공통 코드 목록

### 사용자 및 계정
| 코드그룹 | 코드값:코드라벨 | 설명 |
|---------|--------|------|
| USER_STATUS | ACTIVE:정상, DORMANT:휴면, SUSPENDED:정지, DELETED:삭제 | 관리자 계정 상태 |
| MEMBER_STATUS | ACTIVE:정상, DORMANT:휴면, SUSPENDED:정지, WITHDRAWN:탈퇴 | 회원 활동 상태 |
| MENU_TYPE | GROUP:메뉴그룹, PAGE:페이지링크, FUNCTION:개별기능 | sy_menu 유형 |
| MEMBER_GRADE | BASIC:일반, SILVER:실버, GOLD:골드, VIP:VIP | 회원 등급 |
| LOGIN_RESULT | SUCCESS:성공, FAIL_PWD:비밀번호오류, FAIL_LOCKED:잠금, FAIL_NOT_FOUND:없는계정 | 로그인 결과 |

### 상품 및 카테고리
| 코드그룹 | 코드값:코드라벨 | 설명 |
|---------|--------|------|
| PRODUCT_STATUS | ACTIVE:판매중, DRAFT:비공개, STOPPED:품절, DISCONTINUED:삭제 | 상품 판매 상태 |
| PRODUCT_SIZE | XS:XS, S:S, M:M, L:L, XL:XL, XXL:XXL, FREE:프리 | 의류 사이즈 |
| CATEGORY_DEPTH | 1:1단계, 2:2단계, 3:3단계 | 카테고리 깊이 수준 |
| REVIEW_STATUS | ACTIVE:정상, HIDDEN:숨김, DELETED:삭제 | 리뷰 상태 |

### 주문 및 배송
| 코드그룹 | 코드값:코드라벨 | 설명 |
|---------|--------|------|
| ORDER_STATUS | PENDING:결제대기, PAID:결제완료, PREPARING:상품준비, SHIPPED:배송중, COMPLT:배송완료, CANCELLED:취소, RETURNED:반품 | 주문 처리 단계 |
| ORDER_ITEM_STATUS | NORMAL:정상, PARTIAL_CANCELLED:부분취소, PARTIALLY_SHIPPED:부분배송, SHIPPED:배송완료, COMPLT:거래완료, CANCELLED:취소, RETURNED:반품 | 주문 항목별 처리 단계 |
| CART_STATUS | ACTIVE:활성, ORDERED:주문완료, EXPIRED:만료 | 장바구니 상태 |
| DLIV_STATUS | READY:배송준비, PICKED:픽업완료, IN_TRANSIT:배송중, DELIVERED:배송완료, FAILED:배송실패 | 배송 처리 단계 |
| COURIER | CJ:CJ대한통운, LOGEN:로젠택배, POST:우체국택배, HANJIN:한진택배, LOTTE:롯데택배 | 택배사 |

### 결제 및 환불
| 코드그룹 | 코드값:코드라벨 | 설명 |
|---------|--------|------|
| PAY_METHOD_CD | BANK_TRANSFER:무통장입금, VBANK:가상계좌, TOSS:토스페이먼스, KAKAO:카카오페이, NAVER:네이버페이, MOBILE:핸드폰결제 | 결제수단 |
| PAY_STATUS | PENDING:결제대기, COMPLT:결제완료, FAILED:결제실패, CANCELLED:결제취소, REFUNDED:환불완료 | 결제상태 |
| REFUND_METHOD_CD | CARD:카드취소, ACCOUNT:계좌환불, MOBILE:적립금환불 | 환불수단 |
| REFUND_STATUS | PENDING:환불대기, COMPLT:환불완료, FAILED:환불실패 | 환불상태 |

### 클레임 (취소/반품/교환)
| 코드그룹 | 코드값:코드라벨 | 설명 |
|---------|--------|------|
| CLAIM_TYPE | CANCEL:취소, RETURN:반품, EXCHANGE:교환 | 클레임 유형 |
| CLAIM_STATUS | REQUESTED:접수, APPROVED:승인, PROCESSING:처리중, COMPLT:완료, REJECTED:거절 | 클레임 처리 단계 |
| CLAIM_ITEM_STATUS | REQUESTED:접수, APPROVED:승인, PARTIAL_APPROVED:부분승인, IN_RETURN:반품진행중, RETURNED:반품완료, IN_REFUND:환불진행중, REFUNDED:환불완료, EXCHANGE_IN_RETURN:교환반품진행, EXCHANGE_IN_DELIVERY:교환배송진행, EXCHANGE_COMPLT:교환완료, CANCELLED:취소 | 클레임 항목별 처리 단계 |
| CLAIM_REASON | CHANGE_OF_MIND:단순변심, DEFECT:상품불량, WRONG_ITEM:오배송, DELAY:배송지연, OTHER:기타 | 클레임 요청 사유 |

### 할인·사은품·상품권·기획전 (pm_)
| 코드그룹 | 코드값:코드라벨 | 설명 |
|---------|--------|------|
| DISCNT_TYPE | RATE:정률할인, FIXED:정액할인, FREE_SHIP:무료배송 | 할인 유형 |
| DISCNT_TARGET | ALL:전체, CATEGORY:카테고리, PRODUCT:상품, MEMBER_GRADE:등급 | 할인 대상 범위 |
| DISCNT_STATUS | ACTIVE:진행중, INACTIVE:비활성, EXPIRED:만료 | 할인 진행 상태 |
| DISCNT_ITEM_TARGET | CATEGORY:카테고리, PRODUCT:상품, MEMBER_GRADE:회원등급 | 할인 항목 적용 대상 |
| SAVE_TYPE | EARN:구매적립, USE:사용, EXPIRE:소멸, CANCEL:적립취소, ADMIN:관리자조정 | 적립금 변동 유형 |
| GIFT_TYPE | PRODUCT:상품, SAMPLE:샘플, ETC:기타 | 사은품 유형 |
| GIFT_STATUS | ACTIVE:진행중, INACTIVE:비활성 | 사은품 행사 상태 |
| GIFT_COND_TYPE | ORDER_AMT:주문금액, PRODUCT:상품구매, MEMBER_GRADE:회원등급 | 사은품 제공 조건 유형 |
| GIFT_ISSUE_STATUS | ISSUED:발급, DELIVERED:배송완료, CANCELLED:취소 | 사은품 발급 상태 |
| VOUCHER_TYPE | AMOUNT:금액권, RATE:정률권 | 상품권 유형 |
| VOUCHER_STATUS | ACTIVE:판매중, INACTIVE:비활성, EXPIRED:만료 | 상품권 상태 |
| VOUCHER_ISSUE_STATUS | ISSUED:발급, USED:사용, EXPIRED:만료, CANCELLED:취소 | 상품권 발급(사용) 상태 |
| PLAN_TYPE | SEASON:시즌, BRAND:브랜드, THEME:테마, COLLAB:협업 | 기획전 유형 |
| PLAN_STATUS | DRAFT:임시, ACTIVE:진행중, ENDED:종료 | 기획전 진행 상태 |

### 쿠폰 및 이벤트
| 코드그룹 | 코드값:코드라벨 | 설명 |
|---------|--------|------|
| COUPON_TYPE | RATE:정률할인, FIXED:정액할인 | 할인 쿠폰 유형 |
| COUPON_STATUS | ACTIVE:사용가능, INACTIVE:비활성, EXPIRED:만료 | 쿠폰 활성 상태 |
| EVENT_TYPE | SALE:할인이벤트, LUCKY:럭키드로우, REVIEW:리뷰이벤트, JOIN:가입이벤트 | 이벤트 종류 |
| EVENT_STATUS | DRAFT:임시저장, ACTIVE:진행중, PAUSED:일시정지, ENDED:종료, CLOSED:닫힘 | 이벤트 진행 상태 |

### 전시 및 커뮤니티
| 코드그룹 | 코드값:코드라벨 | 설명 |
|---------|--------|------|
| DISP_TYPE | SLIDE:슬라이드, GRID:그리드, LIST:리스트, SINGLE:단일 | 위젯 표시 방식 |
| DISP_STATUS | ACTIVE:노출중, INACTIVE:미노출 | 패널 활성 상태 |
| DISP_AREA | MAIN_TOP:메인 상단, MAIN_BANNER:메인 배너, MAIN_PRODUCT:메인 상품, MAIN_BOTTOM:메인 하단, CATEGORY_TOP:카테고리 상단, POPUP:팝업 | 노출 영역 코드 |
| WIDGET_TYPE | image_banner:이미지배너, product_slider:상품슬라이더, product:상품, cond_product:조건상품, chart_bar:막대차트, chart_line:선차트, chart_pie:파이차트, text_banner:텍스트배너, info_card:정보카드, popup:팝업, file:파일, file_list:파일목록, coupon:쿠폰, html_editor:HTML에디터, event_banner:이벤트배너, cache_banner:적립금배너, widget_embed:위젯임베드, barcode:바코드, countdown:카운트다운 | 위젯 유형 |
| VISIBILITY_TARGET | PUBLIC:비회원포함, MEMBER:회원, VIP:VIP회원 (^CODE^ 인코딩) | 노출 대상 |
| NOTICE_TYPE | GENERAL:일반공지, EVENT:이벤트, SERVICE:서비스안내, SYSTEM:시스템 | 공지사항 종류 |
| CONTACT_STATUS | PENDING:답변대기, ANSWERED:답변완료, CLOSED:종료 | 1:1 문의 처리 상태 |
| CHATT_STATUS | OPEN:진행중, CLOSED:종료 | 채팅방 상태 |
| MEDIA_TYPE | IMAGE:이미지, VIDEO:동영상 | 미디어 유형 |

### 정산 (st_)
| 코드그룹 | 코드값:코드라벨 | 설명 |
|---------|--------|------|
| RAW_TYPE | ORDER:주문, CLAIM:클레임 | 정산수집 원천 유형 |
| RAW_STATUS | PENDING:수집대기, COLLECTED:수집완료, SETTLED:정산완료, EXCLUDED:제외 | 정산수집 처리 상태 |
| VENDOR_TYPE | SALE:판매업체, DLIV:배송업체, EXTERNAL:외부업체 | 업체 구분 |
| SETTLE_CYCLE | DAILY:일별, WEEKLY:주별, MONTHLY:월별 | 정산 주기 |
| SETTLE_STATUS | DRAFT:작성중, CONFIRMED:확정, CLOSED:마감, PAID:지급완료 | 정산 처리 상태 |
| SETTLE_ITEM_TYPE | SALE:판매, CANCEL:취소, RETURN:반품 | 정산 항목 유형 |
| SETTLE_ADJ_TYPE | ADD:가산, DEDUCT:차감 | 정산 조정 방향 |
| SETTLE_ETC_ADJ_TYPE | SHIP:배송비, RETURN_SHIP:반품배송비, PENALTY:위약금, OTHER:기타 | 기타 조정 유형 |
| SETTLE_CLOSE_STATUS | CLOSED:마감완료, REOPENED:재오픈 | 정산 마감 상태 |
| SETTLE_PAY_STATUS | PENDING:지급대기, COMPLT:지급완료, FAILED:지급실패 | 정산 지급 상태 |
| ADJ_DIR | ADD:가산, DEDUCT:차감 | 조정 방향 (범용) |
| RECON_TYPE | ORDER:주문, PAY:결제, CLAIM:클레임, VENDOR:업체 | 정산 대사 유형 |
| RECON_STATUS | MATCHED:일치, MISMATCH:불일치, RESOLVED:해소 | 정산 대사 상태 |
| ERP_VOUCHER_TYPE | SETTLE:정산전표, RETURN:환불전표, ADJ:조정전표, PAY:지급전표 | ERP 전표 유형 |
| ERP_VOUCHER_STATUS | DRAFT:작성중, CONFIRMED:확정, SENT:전송완료, MATCHED:대사일치, MISMATCH:대사불일치, ERROR:전송오류 | ERP 전표 상태 |

### 결재
| 코드그룹 | 코드값:코드라벨 | 설명 |
|---------|--------|------|
| APPROVAL_STATUS | REQ:요청, APPROVED:승인, REJECTED:반려, DONE:완료 | 결재 처리 상태 |
| APPROVAL_TARGET | ORDER:주문, PROD:상품, DLIV:배송, EXTRA:추가결재 | 결재 대상 유형 |

### 시스템 및 배치
| 코드그룹 | 코드값:코드라벨 | 설명 |
|---------|--------|------|
| ALARM_TYPE | ORDER:주문알림, CLAIM:클레임알림, SYSTEM:시스템알림, MARKETING:마케팅 | 알림 발송 유형 |
| ALARM_CHANNEL | EMAIL:이메일, SMS:SMS, PUSH:푸시알림, KAKAO:카카오알림 | 발송 채널 |
| ALARM_STATUS | DRAFT:임시, SCHEDULED:예약, SENT:발송완료, FAILED:발송실패 | 알림 상태 |
| TEMPLATE_TYPE | EMAIL:이메일, SMS:SMS, PUSH:푸시, KAKAO:카카오 | 발송 템플릿 종류 |
| BATCH_CYCLE | HOURLY:매시간, DAILY:매일, WEEKLY:매주, MONTHLY:매월, MANUAL:수동 | 배치 실행 주기 |
| BATCH_STATUS | ACTIVE:활성, INACTIVE:비활성 | 배치 활성 상태 |
| VENDOR_STATUS | ACTIVE:계약중, INACTIVE:비활성, SUSPENDED:계약정지 | 업체 계약 상태 |
| SITE_STATUS | ACTIVE:운영중, MAINTENANCE:점검중, INACTIVE:비활성 | 사이트 운영 상태 |
| DEPT_TYPE | HQ:본사, BRANCH:지점, TEAM:팀 | 조직 부서 유형 |
| AUTH_METHOD_CD | MAIN:인증메일, SMS:SMS인증, OTP:OTP, AUTHENTICATOR:앱인증 | 인증 방식 |
| PROP_TYPE | STRING:문자열, NUMBER:숫자, BOOLEAN:불린, JSON:JSON | 프로퍼티 값 유형 |
| USE_YN | Y:사용, N:미사용 | 공통 사용여부 |

---

## 변경이력
- 2026-04-16: 초기 작성
- 2026-04-16: method → method_cd로 통일, PAY_METHOD_CD/REFUND_METHOD_CD/AUTH_METHOD_CD 추가
- 2026-04-18: discnt_amt 약어 통일 (discount_amt → discnt_amt), 도메인 접두사 7종 추가 (cm_/mb_/od_/pd_/pm_/dp_), log 예외 약어 상세화, 누락 코드그룹 추가 (LOGIN_RESULT/CART_STATUS/REVIEW_STATUS/WIDGET_TYPE/VISIBILITY_TARGET/APPROVAL_STATUS/APPROVAL_TARGET/ALARM_STATUS/PROP_TYPE)
- 2026-04-18: sl_ 도메인 추가 (정산), pm_/sl_ 신규 엔티티 약어 추가, 신규 코드그룹 추가 (DISCNT_TYPE/DISCNT_TARGET/DISCNT_STATUS/DISCNT_ITEM_TARGET/SAVE_TYPE/GIFT_TYPE/GIFT_STATUS/GIFT_COND_TYPE/GIFT_ISSUE_STATUS/VOUCHER_TYPE/VOUCHER_STATUS/VOUCHER_ISSUE_STATUS/PLAN_TYPE/PLAN_STATUS/SETTLE_CYCLE/SETTLE_STATUS/SETTLE_ITEM_TYPE/SETTLE_ADJ_TYPE/SETTLE_ETC_ADJ_TYPE/SETTLE_CLOSE_STATUS/SETTLE_PAY_STATUS/ADJ_DIR)
- 2026-04-18: sl_ → st_ 도메인 변경 (정산), st_settle_raw(수집원장)/st_recon(대사) 신규 추가, RAW_TYPE/RAW_STATUS/VENDOR_TYPE/RECON_TYPE/RECON_STATUS 코드그룹 추가
- 2026-04-18: st_erp_voucher/st_erp_voucher_line 추가 (ERP 전표), ERP_VOUCHER_TYPE/ERP_VOUCHER_STATUS 코드그룹 추가
- 2026-04-18: USER_STATUS 코드 수정 (INACTIVE→DORMANT, LOCKED→SUSPENDED, DELETED 추가), MENU_TYPE 코드그룹 추가
