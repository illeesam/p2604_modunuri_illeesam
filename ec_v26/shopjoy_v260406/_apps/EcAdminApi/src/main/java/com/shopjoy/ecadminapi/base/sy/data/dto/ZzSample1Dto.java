package com.shopjoy.ecadminapi.base.sy.data.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ZzSample1Dto {
    private String sample1Id;
    private String category;
    private String title;
    private String content;
    private String status;
    private Integer viewCount;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
}
