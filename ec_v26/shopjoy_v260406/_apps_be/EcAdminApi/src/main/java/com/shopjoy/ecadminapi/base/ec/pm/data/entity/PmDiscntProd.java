package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

@Entity
@Table(name = "pm_discnt_prod", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Comment("할인 적용 상품 전개 (배치 생성)")
public class PmDiscntProd {

    /* 대리키 PK — (discnt_id, prod_id) 복합키였으나 정책에 따라 단일 PK + UNIQUE 로 전환.
       유일성은 pm_discnt_prod_uk_discnt_id_prod_id_x2 가 계속 보장한다. */
    @Id
    @Comment("할인상품ID (PK)")
    @Column(name = "discnt_prod_id", length = 21, nullable = false)
    private String discntProdId;

    @Comment("할인ID (pm_discnt.discnt_id)")
    @Column(name = "discnt_id", length = 21, nullable = false)
    private String discntId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("배치 생성일시")
    @Column(name = "reg_date")
    private LocalDateTime regDate;
}
