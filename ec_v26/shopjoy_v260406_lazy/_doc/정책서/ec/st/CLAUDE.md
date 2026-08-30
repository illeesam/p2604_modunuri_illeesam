# 정책서/ec/st/ — 정산(Settlement) 도메인 정책

월별 판매자 정산액 계산, 수수료, 마감, 지급, ERP 전표 처리 정책.

## 파일 목록

| 파일 | 내용 |
|---|---|
| `st.01.정산상태표.md` | 정산 마감·지급·원장·ERP 상태 코드 표 (참조 전용) |
| `st.02.정산마감.md` | 월별 정산액 계산, 수수료 차감, 마감 상태 관리 |
| `st.03.정산처리.md` | 정산액 지급 요청, 확인, 이의신청 처리 정책 |
| `st.04.정산수집원장대사.md` | 원장 수집, 대사(매칭), 차이 관리 정책 |
| `st.05.정산ERP전표.md` | ERP 전표 생성 및 전송 정책 |

## 관련 테이블
`st_settle`, `st_settle_close`, `st_settle_pay`, `st_settle_raw`, `st_recon`, `st_erp_voucher`

## 관련 화면
| pageId | 라벨 |
|---|---|
| `ecSettleMng` | 정산관리 > 정산목록 |
| `ecSettleDtl` | 정산관리 > 정산상세 |
