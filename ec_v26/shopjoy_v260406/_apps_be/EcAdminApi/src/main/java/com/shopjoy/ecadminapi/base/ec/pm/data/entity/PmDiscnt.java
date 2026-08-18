package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "discntId 는 21자 이내여야 합니다.")
    private String discntId;


    @Comment("할인명")
    @Column(name = "discnt_nm", length = 100, nullable = false)
    @Size(max = 100, message = "discntNm 는 100자 이내여야 합니다.")
    private String discntNm;

    @Comment("할인유형 (코드: DISCNT_TYPE — PROD/ORDER/SHIP/SHIP_FREE)")
    @Column(name = "discnt_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "discntTypeCd 는 20자 이내여야 합니다.")
    private String discntTypeCd;

    @Comment("할인방식 (코드: DISCNT_VAL_TYPE_CD — RATE/AMOUNT, SHIP_FREE 유형은 해당없음)")
    @Column(name = "discnt_val_type_cd", length = 20)
    @Size(max = 20, message = "discntValTypeCd 는 20자 이내여야 합니다.")
    private String discntValTypeCd;

    @Comment("할인대상 (코드: DISCNT_TARGET_CD — ALL/CATEGORY/PRODUCT/MEMBER_GRADE)")
    @Column(name = "discnt_target_cd", length = 20)
    @Size(max = 20, message = "discntTargetCd 는 20자 이내여야 합니다.")
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
    private LocalDate startDate;

    @Comment("할인 종료일시")
    @Column(name = "end_date")
    private LocalDate endDate;

    @Comment("상태 (코드: DISCNT_STATUS_CD)")
    @Column(name = "discnt_status_cd", length = 20)
    @Size(max = 20, message = "discntStatusCd 는 20자 이내여야 합니다.")
    private String discntStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "discnt_status_cd_before", length = 20)
    @Size(max = 20, message = "discntStatusCdBefore 는 20자 이내여야 합니다.")
    private String discntStatusCdBefore;

    @Comment("할인 설명")
    @Column(name = "discnt_desc", columnDefinition = "TEXT")
    @Size(max = 50000, message = "discntDesc 는 50000자 이내여야 합니다.")
    private String discntDesc;

    @Comment("적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)")
    @Column(name = "mem_grade_cd", length = 20)
    @Size(max = 20, message = "memGradeCd 는 20자 이내여야 합니다.")
    private String memGradeCd;

    @Comment("자사(사이트) 분담율 (%) — 기본 100%")
    @Column(name = "self_cdiv_rate")
    private BigDecimal selfCdivRate;

    @Comment("판매자(업체) 분담율 (%) — 기본 0%")
    @Column(name = "seller_cdiv_rate")
    private BigDecimal sellerCdivRate;

    @Comment("PC 채널 적용여부 Y/N")
    @Column(name = "dvc_pc_yn", length = 1)
    @Size(max = 1, message = "dvcPcYn 는 1자 이내여야 합니다.")
    private String dvcPcYn;

    @Comment("모바일WEB 적용여부 Y/N")
    @Column(name = "dvc_mweb_yn", length = 1)
    @Size(max = 1, message = "dvcMwebYn 는 1자 이내여야 합니다.")
    private String dvcMwebYn;

    @Comment("모바일APP 적용여부 Y/N")
    @Column(name = "dvc_mapp_yn", length = 1)
    @Size(max = 1, message = "dvcMappYn 는 1자 이내여야 합니다.")
    private String dvcMappYn;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("시뮬데이터여부 (Y/N)")
    @Column(name = "simul_yn", length = 1, columnDefinition = "VARCHAR(1) DEFAULT 'N'")
    @Size(max = 1, message = "simulYn 는 1자 이내여야 합니다.")
    private String simulYn;

    @Comment("판매업체 (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21)
    @Size(max = 21, message = "vendorId 는 21자 이내여야 합니다.")
    private String vendorId;

    @Comment("판매담당자명 (업체 선택 시 자동 채움, 수정 가능)")
    @Column(name = "charge_staff", length = 50)
    @Size(max = 50, message = "chargeStaff 는 50자 이내여야 합니다.")
    private String chargeStaff;

    @Comment("공개대상 (^코드^코드^ 형식, 예: ^PUBLIC^)")
    @Column(name = "visibility_targets", length = 200)
    @Size(max = 100, message = "visibilityTargets 는 100자 이내여야 합니다.")
    private String visibilityTargets;

    @Comment("담당MD (sy_user.user_id)")
    @Column(name = "md_user_id", length = 21)
    @Size(max = 21, message = "mdUserId 는 21자 이내여야 합니다.")
    private String mdUserId;

}
