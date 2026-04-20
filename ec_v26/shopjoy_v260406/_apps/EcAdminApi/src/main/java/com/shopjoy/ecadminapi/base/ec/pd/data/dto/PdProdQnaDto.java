package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdQnaDto {

    // ── pd_prod_qna ──────────────────────────────────────────
    private String qnaId;
    private String siteId;
    private String prodId;
    private String skuId;
    private String memberId;
    private String orderId;
    private String qnaTypeCd;
    private String qnaTitle;
    private String qnaContent;
    private String scrtYn;
    private String answYn;
    private String answContent;
    private LocalDateTime answDate;
    private String answUserId;
    private String dispYn;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
