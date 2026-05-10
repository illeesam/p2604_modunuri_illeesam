package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmSaveItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String saveItemId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String saveItemId;
        private String saveId;
        private String siteId;
        private String targetTypeCd;
        private String targetId;
        private String regBy;
        private LocalDateTime regDate;
        private String siteNm;
        private String targetTypeCdNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
