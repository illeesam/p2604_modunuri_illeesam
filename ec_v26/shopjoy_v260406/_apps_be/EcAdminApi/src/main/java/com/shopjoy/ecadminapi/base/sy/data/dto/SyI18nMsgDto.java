package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyI18nMsgDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String i18nMsgId;
        @Size(max = 21) private String i18nId;
        @Size(max = 10) private String langCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_i18n_msg ──────────────────────────────────────────
        private String i18nMsgId;
        private String i18nId;
        private String langCd;
        private String i18nMsg;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
