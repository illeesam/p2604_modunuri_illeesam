package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBlogGoodDto {

    // ── cm_blog_good ──────────────────────────────────────────
    private String likeId;
    private String blogId;
    private String userId;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
