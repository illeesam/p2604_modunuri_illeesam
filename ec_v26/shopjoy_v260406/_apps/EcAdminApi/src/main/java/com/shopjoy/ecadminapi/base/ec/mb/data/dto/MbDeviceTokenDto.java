package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbDeviceTokenDto {

    // ── mb_device_token ───────────────────────────────────────
    private String deviceTokenId;
    private String deviceToken;
    private String siteId;
    private String memberId;
    private String osType;
    private String benefitNotiYn;
    private LocalDateTime alimReadDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN ─────────────────────────────────────────────────
    private String memberNm;
}
