package com.shopjoy.ecBeBo.md.cb.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MdCbSymbolDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;    // 사이트ID 필터
        @Size(max = 21) private String symbolId;  // 기호ID 필터
        @Size(max = 1)  private String useYn;     // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String symbolId;        // 기호ID (YYMMDDhhmmss+rand4)
        private String symbolCd;        // 기호코드 (UNIQUE)
        private String symbolNm;        // 기호명 (한글)
        private String symbolChar;      // 격자 표시용 기호 문자
        private String symbolDesc;      // 기호 설명
        private Integer stitchConsume;  // 소모 코 수
        private Integer stitchProduce;  // 생성 코 수
        private Integer sortOrd;        // 정렬순서
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
