package com.shopjoy.ecadminapi.md.cb.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class MdCbPatternYarnDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;     // 사이트ID 필터
        @Size(max = 21) private String patternId;  // 도안ID 필터 (필수 — 도안별로만 조회)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String patternYarnId; // 도안실매핑ID (YYMMDDhhmmss+rand4)
        private String patternId;     // 도안ID (md_cb_pattern.pattern_id)
        private String yarnId;        // 실ID (md_cb_yarn.yarn_id)
        private String usageDesc;     // 사용 설명 (예: 메인 색상, 포인트 색상)
    }
}
