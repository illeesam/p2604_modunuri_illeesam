package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Comment;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pm_event_prod", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@Comment("이벤트 적용 상품 전개 (배치 생성)")
public class PmEventProd {

    /* 대리키 PK — (event_id, prod_id) 복합키였으나 정책에 따라 단일 PK + UNIQUE 로 전환.
       유일성은 pm_event_prod_uk_event_id_prod_id_x2 가 계속 보장한다. */
    @Id
    @Comment("이벤트상품ID (PK)")
    @Column(name = "event_prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "eventProdId 는 21자 이내여야 합니다.")
    private String eventProdId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("이벤트ID (pm_event.event_id)")
    @Column(name = "event_id", length = 21, nullable = false)
    @Size(max = 21, message = "eventId 는 21자 이내여야 합니다.")
    private String eventId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("배치 생성일시")
    @Column(name = "reg_date")
    private LocalDateTime regDate;
}
