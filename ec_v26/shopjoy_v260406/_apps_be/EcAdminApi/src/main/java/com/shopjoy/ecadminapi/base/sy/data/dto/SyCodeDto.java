package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyCodeDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String codeId;
        @Size(max = 50) private String codeGrp;
        /* 코드그룹 다중 조회 — 화면이 필요한 그룹을 한 번에 받는다(지연 로딩 배치).
           codeGrp(단일)과 함께 오면 둘 다 AND 로 걸리므로 보통 하나만 쓴다. */
        private java.util.List<String> codeGrps;
        @Size(max = 50) private String codeValue;
        @Size(max = 50) private String parentCodeValue;
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_code ──────────────────────────────────────────
        private String codeId;
        private String codeGrpId;  // FK → sy_code_grp.code_grp_id
        private String codeGrp;    // JOIN from sy_code_grp.code_grp (읽기 전용)
        private String codeValue;
        private String codeLabel;
        private Integer sortOrd;
        private String useYn;
        private String parentCodeValue;
        private String childCodeValues;
        private String codeRemark;
        private Integer codeLevel;
        private String codeOpt1;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String grpNm;
    }

}
