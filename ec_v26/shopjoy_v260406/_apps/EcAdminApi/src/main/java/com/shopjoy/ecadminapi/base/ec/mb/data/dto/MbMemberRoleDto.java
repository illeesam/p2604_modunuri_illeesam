package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
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
        @Size(max = 21) private String memberRoleId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String memberRoleId;
        private String memberId;
        private String roleId;
        private String grantUserId;
        private LocalDateTime grantDate;
        private LocalDate validFrom;
        private LocalDate validTo;
        private String memberRoleRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String memberNm;
        private String roleNm;
        private String grantUserNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
