package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pm_discnt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 할인 엔티티
@Comment("할인정책")
public class PmDiscnt extends BaseEntity {

    @Id
    @Comment("할인ID (YYMMDDhhmmss+rand4)")
    @Column(name = "discnt_id", length = 21, nullable = false)
    private String discntId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("할인명")
    @Column(name = "discnt_nm", length = 100, nullable = false)
    private String discntNm;

    @Comment("할인유형 (코드: DISCNT_TYPE — RATE/FIXED/FREE_SHIP)")
    @Column(name = "discnt_type_cd", length = 20, nullable = false)
    private String discntTypeCd;

    @Comment("할인대상 (코드: DISCNT_TARGET — ALL/CATEGORY/PRODUCT/MEMBER_GRADE)")
    @Column(name = "discnt_target_cd", length = 20)
    private String discntTargetCd;

    @Comment("할인값 (정률이면 %, 정액이면 원)")
    @Column(name = "discnt_value")
    private BigDecimal discntValue;

    @Comment("최소주문금액")
    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Comment("최소주문수량 (NULL=제한없음)")
    @Column(name = "min_order_qty")
    private Integer minOrderQty;

    @Comment("최대할인한도 (NULL=무제한)")
    @Column(name = "max_discnt_amt")
    private Long maxDiscntAmt;

    @Comment("할인 시작일시")
    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Comment("할인 종료일시")
    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Comment("상태 (코드: DISCNT_STATUS)")
    @Column(name = "discnt_status_cd", length = 20)
    private String discntStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "discnt_status_cd_before", length = 20)
    private String discntStatusCdBefore;

    @Comment("할인 설명")
    @Column(name = "discnt_desc", columnDefinition = "TEXT")
    private String discntDesc;

    @Comment("적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)")
    @Column(name = "mem_grade_cd", length = 20)
    private String memGradeCd;

    @Comment("자사(사이트) 분담율 (%) — 기본 100%")
    @Column(name = "self_cdiv_rate")
    private BigDecimal selfCdivRate;

    @Comment("판매자(업체) 분담율 (%) — 기본 0%")
    @Column(name = "seller_cdiv_rate")
    private BigDecimal sellerCdivRate;

    @Comment("PC 채널 적용여부 Y/N")
    @Column(name = "dvc_pc_yn", length = 1)
    private String dvcPcYn;

    @Comment("모바일WEB 적용여부 Y/N")
    @Column(name = "dvc_mweb_yn", length = 1)
    private String dvcMwebYn;

    @Comment("모바일APP 적용여부 Y/N")
    @Column(name = "dvc_mapp_yn", length = 1)
    private String dvcMappYn;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
