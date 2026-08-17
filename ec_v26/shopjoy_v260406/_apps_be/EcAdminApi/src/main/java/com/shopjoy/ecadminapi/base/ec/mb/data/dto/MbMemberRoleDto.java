package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class MbMemberRoleDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String memberRoleId;   // 회원역할연결ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String memberRoleId;              // PK
        private String memberId;                   // 회원 ID (mb_member.member_id)
        private String roleId;                      // 역할 ID (sy_role.role_id)
        private String grantUserId;                  // 권한 부여 관리자 ID
        private LocalDateTime grantDate;              // 권한 부여 일시
        private LocalDate validFrom;                   // 유효 시작일
        private LocalDate validTo;                      // 유효 종료일
        private String memberRoleRemark;                // 비고
        private String regBy;                            // 등록자
        private LocalDateTime regDate;                    // 등록일시
        private String regSiteId;                         // 등록 사이트ID
        private String updBy;                               // 수정자
        private LocalDateTime updDate;                      // 수정일시
        private String memberNm;                             // 회원명 (조인)
        private String roleNm;                                // 역할명 (조인)
        private String grantUserNm;                           // 권한 부여자명 (조인)
    }

}
