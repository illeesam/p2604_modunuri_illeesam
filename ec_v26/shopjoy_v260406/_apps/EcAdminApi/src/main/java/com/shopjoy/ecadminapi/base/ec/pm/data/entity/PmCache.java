package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pm_cache", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 캐시(충전금) 엔티티
public class PmCache extends BaseEntity {

    @Id
    @Column(name = "cache_id", length = 21, nullable = false)
    private String cacheId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Column(name = "cache_type_cd", length = 20, nullable = false)
    private String cacheTypeCd;

    @Column(name = "cache_amt")
    private Long cacheAmt;

    @Column(name = "balance_amt")
    private Long balanceAmt;

    @Column(name = "ref_id", length = 21)
    private String refId;

    @Column(name = "cache_desc", length = 200)
    private String cacheDesc;

    @Column(name = "proc_user_id", length = 21)
    private String procUserId;

    @Column(name = "cache_date")
    private LocalDateTime cacheDate;

    @Column(name = "expire_date")
    private LocalDate expireDate;

}
