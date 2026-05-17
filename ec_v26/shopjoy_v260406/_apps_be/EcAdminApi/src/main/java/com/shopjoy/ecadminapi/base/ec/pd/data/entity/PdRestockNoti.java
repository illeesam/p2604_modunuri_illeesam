package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pd_restock_noti", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 재입고 알림 엔티티
@Comment("재입고알림 신청")
public class PdRestockNoti extends BaseEntity {

    @Id
    @Comment("재입고알림ID (YYMMDDhhmmss+rand4)")
    @Column(name = "restock_noti_id", length = 21, nullable = false)
    private String restockNotiId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("SKUID (pd_prod_sku.sku_id)")
    @Column(name = "sku_id", length = 21)
    private String skuId;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("알림발송여부 Y/N")
    @Column(name = "noti_yn", length = 1)
    private String notiYn;

    @Comment("알림발송일시")
    @Column(name = "noti_date")
    private LocalDateTime notiDate;

}
