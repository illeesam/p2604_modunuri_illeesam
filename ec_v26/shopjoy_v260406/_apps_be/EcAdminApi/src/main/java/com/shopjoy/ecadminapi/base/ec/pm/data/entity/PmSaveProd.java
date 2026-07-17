package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Comment;

import java.io.Serializable;
import java.time.LocalDateTime;

@Entity
@Table(name = "pm_save_prod", schema = "shopjoy_2604")
@IdClass(PmSaveProd.PK.class)
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Comment("적립금 적용 상품 전개 (배치 생성)")
public class PmSaveProd {

    @Id
    @Comment("적립금ID (pm_save.save_id)")
    @Column(name = "save_id", length = 21, nullable = false)
    private String saveId;

    @Id
    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("배치 생성일시")
    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Data
    @NoArgsConstructor @AllArgsConstructor
    public static class PK implements Serializable {
        private String saveId;
        private String prodId;
    }
}
