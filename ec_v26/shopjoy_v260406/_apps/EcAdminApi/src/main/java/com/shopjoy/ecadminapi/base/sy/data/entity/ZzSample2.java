package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "zz_sample2", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ZzSample2 {

    @Id
    @Column(name = "sample2_id", length = 21, nullable = false)
    private String sample2Id;

    @Column(name = "item_name", length = 100, nullable = false)
    private String itemName;

    @Column(name = "item_code", length = 50)
    private String itemCode;

    @Column(name = "price")
    private Integer price;

    @Column(name = "quantity")
    private Integer quantity;

    @Column(name = "remark", length = 300)
    private String remark;

    @Column(name = "is_active", length = 1)
    private String isActive;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;
}
