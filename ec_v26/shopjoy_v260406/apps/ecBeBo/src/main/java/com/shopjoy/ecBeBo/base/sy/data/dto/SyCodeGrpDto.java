package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyCodeGrpDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String codeGrpId;  // 코드그룹ID 필터
        @Size(max = 50) private String codeGrp;  // 코드그룹코드 필터 (예: MEMBER_GRADE)
        @Size(max = 21) private String pathId;  // 표시경로ID 필터
        @Size(max = 1)  private String useYn;  // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_code_grp ──────────────────────────────────────────
        private String codeGrpId;  // 코드그룹ID (YYMMDDhhmmss+rand4)
        private String codeGrp;  // 코드그룹코드 자체 (예: MEMBER_GRADE, UNIQUE with site_id) — sy_code_grp.code_grp
        private String grpNm;  // 그룹명
        private String pathId;  // 점(.) 구분 표시경로 (트리 빌드용)
        private String codeGrpDesc;  // 코드그룹설명
        private String useYn;  // 사용여부 Y/N
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
    }

}
