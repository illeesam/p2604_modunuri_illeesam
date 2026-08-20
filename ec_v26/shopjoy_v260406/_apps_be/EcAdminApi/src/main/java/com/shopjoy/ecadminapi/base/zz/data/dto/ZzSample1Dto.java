package com.shopjoy.ecadminapi.base.zz.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ZzSample1Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        private List<String> sample1Ids;                 // PK 다건 IN
        @Size(max = 21) private String sample1Id;  // 샘플1 ID 검색값
        @Size(max = 1) private String useYn;  // 사용 여부(Y/N) 검색값
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String sample1Id;  // 샘플1 ID (ZS1+YYMMDDHHmmss+rand4)
        private String cdGrp;  // 도메인 구분 키 (S01_MEMBER / S02_PRODUCT 등)
        private String cdVl;  // 코드 값
        private String cdNm;  // 코드명 / 대표 텍스트 (회원명, 상품명 등)
        private BigDecimal srtordVl;  // 정렬 순서
        private String attrNm1;  // 속성명1
        private String attrNm2;  // 속성명2
        private String attrNm3;  // 속성명3
        private String attrNm4;  // 속성명4
        private String explnCn;  // 설명 내용
        private String cdInfwSeCd;  // 코드 유입 구분 코드
        private String useYn;  // 사용 여부 (Y/N)
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String groupCd;  // 그룹 코드
        private String col01;  // 범용 컬럼01 (도메인별 재정의)
        private String col02;  // 범용 컬럼02
        private String col03;  // 범용 컬럼03
        private String col04;  // 범용 컬럼04
        private String col05;  // 범용 컬럼05
        private String col06;  // 범용 컬럼06
        private String col07;  // 범용 컬럼07
        private String col08;  // 범용 컬럼08
        private String col09;  // 범용 컬럼09
        private String statusCd;  // 상태 코드
        private String typeCd;  // 유형 코드
        private String divCd;  // 구분 코드
        private String kindCd;  // 종류 코드
        private String cateCds;  // 카테고리 코드 목록
        // ── 연관정보 (getById 시 채움) ──
        private List<ZzSample2Dto.Item> sample2s;   // 하위 sample2 목록 (sample1_id)
        private List<ZzSample3Dto.Item> sample3s;   // 하위 sample3 목록 (sample1_id)
    }

}
