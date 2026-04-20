package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StSettlePayDto {

    // ── st_settle_pay ──────────────────────────────────────────
    private String settlePayId;
    private String settleId;
    private String siteId;
    private String vendorId;
    private Long payAmt;
    private String payMethodCd;
    private String bankNm;
    private String bankAccount;
    private String bankHolder;
    private String payStatusCd;
    private String payStatusCdBefore;
    private LocalDateTime payDate;
    private String payBy;
    private String settlePayMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
