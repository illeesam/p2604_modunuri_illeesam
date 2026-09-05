package com.shopjoy.ecBeBo.md.cb.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MdCbYarnDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;    // 사이트ID 필터
        @Size(max = 21) private String yarnId;    // 실ID 필터
        @Size(max = 20) private String weightCd;  // 실 굵기 필터
        @Size(max = 1)  private String useYn;     // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String yarnId;          // 실ID (YYMMDDhhmmss+rand4)
        private String yarnNm;          // 실 이름
        private String colorHex;        // 실 색상
        private String weightCd;        // 실 굵기 — CB_YARN_WEIGHT_CD
        private String weightCdNm;      // 실 굵기 코드명 (화면 표시용)
        private String brandNm;         // 실 브랜드명
        private String useYn;           // 사용여부 Y/N
        private String regBy;           // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;       // 등록 사이트ID
        private String siteId;          // 사이트ID
        private String siteNm;          // 사이트명 (조인)
        private String regSiteNm;       // 등록사이트명 (조인)
        private String regUserNm;       // 등록자명 (조인)
        private String updBy;           // 수정자
        private LocalDateTime updDate;  // 수정일
    }
}
