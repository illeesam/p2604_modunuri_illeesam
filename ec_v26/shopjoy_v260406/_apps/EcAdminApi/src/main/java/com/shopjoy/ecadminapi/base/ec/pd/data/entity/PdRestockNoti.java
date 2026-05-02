package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pd_restock_noti", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 재입고 알림 엔티티
public class PdRestockNoti extends BaseEntity {

    @Id
    @Column(name = "restock_noti_id", length = 21, nullable = false)
    private String restockNotiId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "sku_id", length = 21)
    private String skuId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "noti_yn", length = 1)
    private String notiYn;

    @Column(name = "noti_date")
    private LocalDateTime notiDate;

}
