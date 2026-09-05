package com.shopjoy.ecBeBo.base.ec.cm.data.dto;

import lombok.*;

/**
 * cm_dashboard 집계 행 DTO.
 *
 * <p>QueryDSL selectList 결과를 담는다. col1~col9 는 지표명(Nm) + 수치(Num) 쌍으로
 * 대시보드 각 차트 항목(info0101~info0403)에 범용으로 사용된다.</p>
 *
 * <pre>
 * 차트 ID 매핑 (행01~04, 열01~04):
 *  info0101 — 월별 매출현황        col1Nm=월, col1Num=매출액
 *  info0102 — 월별 가입/탈퇴       col1Nm=월, col1Num=가입수, col2Nm=월, col2Num=탈퇴수
 *  info0103 — 월별 상품세 클릭      col1Nm=월, col1Num=클릭수
 *  info0104 — 월별 주문완료         col1Nm=월, col1Num=주문건수
 *  info0201 — 월별 판매채널별 매출  col1Nm=채널명, col1~col9Num=월별값
 *  info0202 — 핵심지표              col1Nm=전체매출액, col2Nm=전체구매수, col3Nm=평균마진율, col4Nm=평균결제금액
 *  info0203 — 상품별 매출 TOP 7     col1Nm=상품명, col1Num=매출액
 *  info0204 — 판매채널비            col1Nm=채널명, col1Num=비율
 *  info0301 — 디바이스별 비중       col1Nm=디바이스, col1Num=비율
 *  info0302 — 시간대별 비중         col1Nm=시간대, col1Num=비율
 *  info0303 — 지역별 매출현황       col1Nm=지역명, col1Num=매출액
 *  info0304 — 시간대별 주문 추이    col1Nm=시각(H), col1Num=주문건수
 *  info0401 — 영업지표 비교         col1Nm=지표명, col1Num=값
 *  info0402 — 경제 수준별 매출현황  col1Nm=월, col1~col3Num=상/중/하 매출
 *  info0403 — 배송 조건별 매출현황  col1Nm=배송조건, col1Num=비율
 * </pre>
 */
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CmDashboardDto {

    private String dashboardId;  // 대시보드 항목ID (info0101 등 차트 ID)
    private String compId;  // 컴포넌트ID (회사/법인 구분)
    private Integer sortOrd;  // 정렬순서
    private String yyyymmdd;  // 집계 기준일자 (YYYYMMDD)
    private String siteNo;  // 사이트 번호
    private String siteNm;  // 사이트명
    private String uiNm;  // 화면명
    private String deptId;  // 부서ID
    private String deptNm;  // 부서명
    private String userId;  // 사용자ID
    private String userNm;  // 사용자명

    private String col1Nm;  // 1열 지표명
    private Double col1Num;  // 1열 지표 수치
    private String col2Nm;  // 2열 지표명
    private Double col2Num;  // 2열 지표 수치
    private String col3Nm;  // 3열 지표명
    private Double col3Num;  // 3열 지표 수치
    private String col4Nm;  // 4열 지표명
    private Double col4Num;  // 4열 지표 수치
    private String col5Nm;  // 5열 지표명
    private Double col5Num;  // 5열 지표 수치
    private String col6Nm;  // 6열 지표명
    private Double col6Num;  // 6열 지표 수치
    private String col7Nm;  // 7열 지표명
    private Double col7Num;  // 7열 지표 수치
    private String col8Nm;  // 8열 지표명
    private Double col8Num;  // 8열 지표 수치
    private String col9Nm;  // 9열 지표명
    private Double col9Num;  // 9열 지표 수치
}
