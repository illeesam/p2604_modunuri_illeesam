package com.shopjoy.ecadminapi.base.sy.data.dto;

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
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String parentDeptId;  // 상위부서ID 필터
        @Size(max = 20) private String typeCd;  // 부서유형 필터 — DEPT_TYPE_CD {HQ:본사, DEV:개발팀, DEV_BACKEND:백엔드, DEV_FRONTEND:프론트엔드, MKT:마케팅팀, LOGIS:물류팀}
        @Size(max = 1)  private String useYn;  // 사용여부 필터 Y/N
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_dept ──────────────────────────────────────────
        private String deptId;  // 부서ID (YYMMDDhhmmss+rand4)
        private String deptCode;  // 부서코드
        private String deptNm;  // 부서명
        private String parentDeptId;  // 상위부서ID
        private String deptTypeCd;  // 부서유형 — DEPT_TYPE_CD {HQ:본사, DEV:개발팀, DEV_BACKEND:백엔드, DEV_FRONTEND:프론트엔드, MKT:마케팅팀, LOGIS:물류팀}
        private String managerId;  // 부서장 (sy_user.user_id)
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String deptRemark;  // 비고
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
}
