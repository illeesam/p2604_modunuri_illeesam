package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdImgDto {

    // ── pd_prod_img ──────────────────────────────────────────
    private String prodImgId;
    private String siteId;
    private String prodId;
    private String optItemId1;
    private String optItemId2;
    private String attachId;
    private String cdnHost;
    private String cdnImgUrl;
    private String cdnThumbUrl;
    private String imgAltText;
    private Integer sortOrd;
    private String isThumb;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
