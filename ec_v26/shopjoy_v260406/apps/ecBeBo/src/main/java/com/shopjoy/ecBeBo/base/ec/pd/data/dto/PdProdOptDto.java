package com.shopjoy.ecBeBo.base.ec.pd.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PdProdOptDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;       // 사이트ID 필터
        @Size(max = 1) private String useYn;           // 사용여부 필터 Y/N
        @Size(max = 21) private String prodOptId;    // 옵션ID 필터
        @Size(max = 21) private String prodId;       // 상품ID 필터
        private List<String> prodIds;                  // PK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodOptId;             // 옵션ID
        private String prodId;                // 상품ID (pd_prod.prod_id) — 조회 편의용 비정규화 컬럼
        private String prodOptNm;             // 옵션명 (예: 빨강, M)
        private String prodOptVal;            // 실제 저장값 — 직접입력 또는 프리셋 선택 시 자동 채움 (자유 문자열)
        private String prodOptStdCd;          // 표준 코드값 — PROD_OPT_STD_CD {BLACK:검정, COTTON:면, XS:XS, POLYESTER:폴리에스터, S:S, WHITE:흰색, LEATHER:가죽, M:M 외 17개}. 프리셋 선택 시 자동 세팅, 직접입력 시 NULL
        private String parentProdOptId;       // 상위 옵션ID — 2단 옵션에서 상위 1단 옵션값 참조 (pd_prod_opt.prod_opt_id), NULL이면 독립값
        private String prodOptStyle;          // 옵션 스타일 (컬러 hex 값, 아이콘 클래스 등 자유 문자열)
        private Integer sortOrd;              // 정렬순서
        private String useYn;                 // 사용여부 Y/N
        private Integer prodOptTypeLevel;  // 1 또는 2
        private String prodOpt1TypeCd;     // 옵션유형1 분류코드 (예: COLOR)
        private String prodOpt2TypeCd;     // 옵션유형2 분류코드 (예: SIZE)
        private String regBy;                 // 등록자
        private LocalDateTime regDate;        // 등록일
        private String regSiteId;             // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                 // 수정자
        private LocalDateTime updDate;        // 수정일
    }

}
