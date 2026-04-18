# 정책서ec-st — 정산(ST) 도메인

## 파일 목록

| 파일 | 내용 |
|---|---|
| `st.01.정산상태표.md` | 정산 마감·지급·원장·ERP 상태 코드 표 + 프로세스 매트릭스 (참조 전용) |
| `st.02.정산마감.md` | 월별 정산액 계산, 수수료, 마감 |
| `st.03.정산처리.md` | 지급 요청, 확인, 이의신청 |
| `st.04.정산수집원장대사.md` | 수집원장, 대사, 타월 환불 처리 |
| `st.05.정산ERP전표.md` | ERP 전표 생성, 복식부기, 전송, 대사 |

## 관련 테이블 (ec-st/)
- `st_settle`, `st_settle_close`, `st_settle_pay` — 정산 마감/지급
- `st_settle_raw` — 수집원장 (od_order_item, od_claim_item 기반)
- `st_settle_item`, `st_settle_adj` — 정산 항목/조정
- `st_recon` — 대사
- `st_erp_voucher` — ERP 전표

## 관리자 화면
| pageId | 라벨 |
|---|---|
| `stConfigMng` | 정산 > 정산기준관리 |
| `stRawMng` | 정산 > 정산수집원장 |
| `stSettleCloseMng` | 정산 > 정산마감 |
| `stSettlePayMng` | 정산 > 정산지급관리 |
| `stErpVoucherMng` | 정산 > ERP 전표조회 |
