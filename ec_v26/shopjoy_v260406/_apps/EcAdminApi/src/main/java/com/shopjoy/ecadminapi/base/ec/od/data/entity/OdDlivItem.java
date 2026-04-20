package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "od_dliv_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 배송 아이템 엔티티
public class OdDlivItem {

    @Id
    @Column(name = "dliv_item_id", length = 21, nullable = false)
    private String dlivItemId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "dliv_id", length = 21, nullable = false)
    private String dlivId;

    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Column(name = "opt_item_id_1", length = 20)
    private String optItemId1;

    @Column(name = "opt_item_id_2", length = 20)
    private String optItemId2;

    @Column(name = "dliv_type_cd", length = 20)
    private String dlivTypeCd;

    @Column(name = "unit_price")
    private Long unitPrice;

    @Column(name = "dliv_qty")
    private Integer dlivQty;

    @Column(name = "dliv_item_status_cd", length = 20)
    private String dlivItemStatusCd;

    @Column(name = "dliv_item_status_cd_before", length = 20)
    private String dlivItemStatusCdBefore;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}