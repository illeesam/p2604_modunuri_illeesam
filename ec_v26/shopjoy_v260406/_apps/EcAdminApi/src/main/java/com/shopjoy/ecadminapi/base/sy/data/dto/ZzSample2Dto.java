package com.shopjoy.ecadminapi.base.sy.data.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ZzSample2Dto {
    private String sample2Id;
    private String itemName;
    private String itemCode;
    private Integer price;
    private Integer quantity;
    private String remark;
    private String isActive;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
}
