package com.shopjoy.ecadminapi.base.zz.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ZzSamy2Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        private List<String> samy1Ids;                 // PK 다건 IN
        private List<String> samy2Ids;                 // PK 다건 IN
        @Size(max = 21) private String samy2Id;  // 샘y2 ID 검색값
        @Size(max = 21) private String samy1Id;   // 상위 FK 필터
        @Size(max = 1)  private String useYn;  // 사용 여부(Y/N) 검색값
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String samy2Id;  // 샘y2 ID
        private String cdGrp;  // 도메인 구분 키
        private String cdVl;  // 코드 값
        private String cdNm;  // 코드명 / 대표 텍스트
        private BigDecimal srtordVl;  // 정렬 순서
        private String attrNm1;  // 속성명1
        private String attrNm2;  // 속성명2
        private String attrNm3;  // 속성명3
        private String attrNm4;  // 속성명4
        private String explnCn;  // 설명 내용
        private String cdInfwSeCd;  // 코드 유입 구분 코드
        private String useYn;  // 사용 여부 (Y/N)
        private String rgtr;  // 등록자 (구 명명)
        private LocalDate regDt;  // 등록일 (구 명명)
        private String mdfr;  // 수정자 (구 명명)
        private LocalDate mdfcnDt;  // 수정일 (구 명명)
        private String groupCd;  // 그룹 코드
        private String col01;  // 범용 컬럼01
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
        private String samy1Id;  // 상위 FK

        // ── 상위 계층 연관정보 ──
        private ZzSamy1Dto.Item samy1;   // 상위 samy1 단건 (samy1_id)

        // ── 하위 계층 연관정보 ──
        private List<ZzSamy3Dto.Item> samy3s;   // 하위 samy3 목록 (samy2_id)
    }

}
