package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyPathDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String pathId;  // 경로ID (PK, auto)
        @Size(max = 50) private String bizCd;  // 업무코드 (참조 테이블명, 예: sy_brand / sy_code_grp / sy_prop)
        @Size(max = 21) private String parentPathId;  // 부모 경로ID (sy_path.path_id, 루트는 NULL)
        @Size(max = 1)  private String useYn;  // 사용여부 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_path ──────────────────────────────────────────
        private String pathId;  // 경로ID (PK, auto)
        private String bizCd;  // 업무코드 (참조 테이블명, 예: sy_brand / sy_code_grp / sy_prop)
        private String parentPathId;  // 부모 경로ID (sy_path.path_id, 루트는 NULL)
        private String pathLabel;  // 경로 라벨 (한글 표시명)
        private Integer sortOrd;  // 동일 부모 내 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String pathRemark;  // 비고
        private String regBy;  // 등록자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime updDate;  // 수정일
    }

}
