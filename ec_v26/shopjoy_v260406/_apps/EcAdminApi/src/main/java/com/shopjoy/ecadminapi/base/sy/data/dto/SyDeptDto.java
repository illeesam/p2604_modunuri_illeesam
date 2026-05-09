package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyDeptDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String parentDeptId;
        @Size(max = 20) private String typeCd;
        @Size(max = 1)  private String useYn;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_dept ──────────────────────────────────────────
        private String deptId;
        private String siteId;
        private String deptCode;
        private String deptNm;
        private String parentDeptId;
        private String deptTypeCd;
        private String managerId;
        private Integer sortOrd;
        private String useYn;
        private String deptRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String siteNm;
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
