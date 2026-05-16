package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "st_settle_config", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 설정 엔티티
@Comment("정산기준 설정")
public class StSettleConfig extends BaseEntity {

    @Id
    @Comment("정산기준ID (YYMMDDhhmmss+rand4)")
    @Column(name = "settle_config_id", length = 21, nullable = false)
    private String settleConfigId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("업체ID (NULL=전체 기준)")
    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Comment("카테고리ID (NULL=전체 기준)")
    @Column(name = "category_id", length = 21)
    private String categoryId;

    @Comment("정산주기 (코드: SETTLE_CYCLE — DAILY/WEEKLY/MONTHLY)")
    @Column(name = "settle_cycle_cd", length = 20)
    private String settleCycleCd;

    @Comment("정산일 (월 N일, MONTHLY 시 사용)")
    @Column(name = "settle_day")
    private Integer settleDay;

    @Comment("수수료율 (%)")
    @Column(name = "commission_rate")
    private BigDecimal commissionRate;

    @Comment("최소 정산금액")
    @Column(name = "min_settle_amt")
    private Long minSettleAmt;

    @Comment("비고")
    @Column(name = "settle_config_remark", length = 500)
    private String settleConfigRemark;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
