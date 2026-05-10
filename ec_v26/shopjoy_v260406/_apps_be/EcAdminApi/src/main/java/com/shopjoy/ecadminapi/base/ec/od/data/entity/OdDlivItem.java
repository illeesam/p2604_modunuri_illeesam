package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "od_dliv_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 배송 아이템 엔티티
public class OdDlivItem extends BaseEntity {

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

    @Column(name = "opt_item_id_1", length = 21)
    private String optItemId1;

    @Column(name = "opt_item_id_2", length = 21)
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

}
