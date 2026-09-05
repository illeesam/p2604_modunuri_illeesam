package com.shopjoy.ecBeBo.md.cb.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

public class MdCbPatternCellDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;     // 사이트ID 필터
        @Size(max = 21) private String patternId;  // 도안ID 필터 (필수 — 도안별로만 조회)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String cellId;      // 셀ID (YYMMDDhhmmss+rand4)
        private String patternId;   // 도안ID (cb_pattern.pattern_id)
        private Integer rowNo;      // 단 번호
        private Integer colNo;      // 코 번호
        private String symbolId;    // 기호ID (cb_symbol.symbol_id)
        private String colorHex;    // 배색
    }
}
