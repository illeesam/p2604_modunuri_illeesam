package com.shopjoy.ecBeBo.base.zz.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class ZzSample0Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String sample0Id;  // 샘플0 ID 검색값
        @Size(max = 1) private String useYn;  // 사용 여부(Y/N) 검색값
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String sample0Id;  // 샘플0 ID (YYMMDDhhmmss+rand4)
        private String sampleName;  // 샘플 이름
        private String sampleDesc;  // 샘플 설명
        private String sampleValue;  // 샘플 값
        private Integer sortOrd;  // 정렬 순서
        private String useYn;  // 사용 여부 (Y/N)
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String col01;  // 범용 컬럼01
        private String col02;  // 범용 컬럼02
        private String col03;  // 범용 컬럼03
        private String col04;  // 범용 컬럼04
        private String col05;  // 범용 컬럼05
        private String col06;  // 범용 컬럼06
        private String col07;  // 범용 컬럼07
        private String col08;  // 범용 컬럼08
        private String col09;  // 범용 컬럼09
    }

}
