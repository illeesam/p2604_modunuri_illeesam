package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

@Entity
@Table(name = "pm_save_prod", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Comment("적립금 적용 상품 전개 (배치 생성)")
public class PmSaveProd {

    /* 대리키 PK — (save_id, prod_id) 복합키였으나 정책에 따라 단일 PK + UNIQUE 로 전환.
       유일성은 pm_save_prod_uk_save_id_prod_id_x2 가 계속 보장한다. */
    @Id
    @Comment("적립상품ID (PK)")
    @Column(name = "save_prod_id", length = 21, nullable = false)
    private String saveProdId;

    @Comment("적립금ID (pm_save.save_id)")
    @Column(name = "save_id", length = 21, nullable = false)
    private String saveId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("배치 생성일시")
    @Column(name = "reg_date")
    private LocalDateTime regDate;
}
