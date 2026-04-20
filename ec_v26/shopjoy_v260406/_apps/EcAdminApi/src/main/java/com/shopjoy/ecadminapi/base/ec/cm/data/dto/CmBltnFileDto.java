package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBltnFileDto {

    // ── cm_bltn_file ──────────────────────────────────────────
    private String blogImgId;
    private String blogId;
    private String imgUrl;
    private String thumbUrl;
    private String imgAltText;
    private Integer sortOrd;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
