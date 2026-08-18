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
/* 적립금 정책(캠페인) 엔티티 — 회원별 적립/사용 원장인 PmSave(pm_save) 와는 별개 테이블.
 * 필드명은 PmSaveDtl.js 폼(saveId/saveNm/saveType/saveUnit/saveStatus 등)과 1:1로 맞춰
 * 프론트 변경 없이 바로 저장/조회되도록 했다. */
@Entity
@Table(name = "pm_save_policy", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("적립금 정책(캠페인)")
public class PmSavePolicy extends BaseEntity {

    @Id
    @Comment("적립금정책ID (YYMMDDhhmmss+rand4)")
    @Column(name = "save_policy_id", length = 21, nullable = false)
    @Size(max = 21, message = "saveId 는 21자 이내여야 합니다.")
    private String saveId;

    @Comment("적립금명")
    @Column(name = "save_policy_nm", length = 100, nullable = false)
    @Size(max = 100, message = "saveNm 는 100자 이내여야 합니다.")
    private String saveNm;

    @Comment("적립금 유형 (코드: SAVE_TYPE_CD)")
    @Column(name = "save_type_cd", length = 20)
    @Size(max = 20, message = "saveTypeCd 는 20자 이내여야 합니다.")
    private String saveTypeCd;

    @Comment("적립유형 (코드: SAVE_ISSUE_TYPE_CD)")
    @Column(name = "save_issue_type_cd", length = 20)
    @Size(max = 20, message = "saveType 는 20자 이내여야 합니다.")
    private String saveType;

    @Comment("적립값")
    @Column(name = "save_val")
    private BigDecimal saveVal;

    @Comment("적립단위 (코드: SAVE_UNIT)")
    @Column(name = "save_unit_cd", length = 10)
    @Size(max = 10, message = "saveUnit 는 10자 이내여야 합니다.")
    private String saveUnit;

    @Comment("최소주문금액")
    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Comment("유효기간(일)")
    @Column(name = "expire_day")
    private Integer expireDay;

    @Comment("상태 (코드: PROMO_STATUS)")
    @Column(name = "save_status_cd", length = 20)
    @Size(max = 20, message = "saveStatus 는 20자 이내여야 합니다.")
    private String saveStatus;

    @Comment("시작일")
    @Column(name = "start_date")
    private LocalDate startDate;

    @Comment("종료일")
    @Column(name = "end_date")
    private LocalDate endDate;

    @Comment("적용 회원등급 코드 (NULL=전체, 코드: MEMBER_GRADE)")
    @Column(name = "mem_grade_cd", length = 20)
    @Size(max = 20, message = "memGradeCd 는 20자 이내여야 합니다.")
    private String memGradeCd;

    @Comment("공개대상 (^코드^코드^ 형식, 예: ^PUBLIC^)")
    @Column(name = "visibility_targets", length = 200)
    @Size(max = 100, message = "visibilityTargets 는 100자 이내여야 합니다.")
    private String visibilityTargets;

    @Comment("판매업체 (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21)
    @Size(max = 21, message = "vendorId 는 21자 이내여야 합니다.")
    private String vendorId;

    @Comment("판매담당자명 (업체 선택 시 자동 채움, 수정 가능)")
    @Column(name = "charge_staff", length = 50)
    @Size(max = 50, message = "chargeStaff 는 50자 이내여야 합니다.")
    private String chargeStaff;

    @Comment("비고")
    @Column(name = "remark", columnDefinition = "TEXT")
    @Size(max = 50000, message = "remark 는 50000자 이내여야 합니다.")
    private String remark;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("시뮬데이터여부 (Y/N)")
    @Column(name = "simul_yn", length = 1, columnDefinition = "VARCHAR(1) DEFAULT 'N'")
    @Size(max = 1, message = "simulYn 는 1자 이내여야 합니다.")
    private String simulYn;

}
