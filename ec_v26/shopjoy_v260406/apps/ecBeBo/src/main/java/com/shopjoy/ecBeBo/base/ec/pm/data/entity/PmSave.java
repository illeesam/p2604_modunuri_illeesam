package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pm_save", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 적립금 엔티티
@Comment("적립금 적립/사용 이력")
public class PmSave extends BaseEntity {

    @Id
    @Comment("적립금ID (YYMMDDhhmmss+rand4)")
    @Column(name = "save_id", length = 21, nullable = false)
    @Size(max = 21, message = "saveId 는 21자 이내여야 합니다.")
    private String saveId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("적립금유형 (코드: SAVE_TYPE_CD — EARN/USE/EXPIRE/CANCEL/ADMIN)")
    @Column(name = "save_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "saveTypeCd 는 20자 이내여야 합니다.")
    private String saveTypeCd;

    @Comment("적립용도 (코드: SAVE_PURPOSE_CD — PURCHASE/REVIEW/JOIN/BIRTHDAY/VIP/EVENT/ADMIN)")
    @Column(name = "save_purpose_cd", length = 20)
    @Size(max = 20, message = "savePurposeCd 는 20자 이내여야 합니다.")
    private String savePurposeCd;

    @Comment("변동액 (양수:적립, 음수:차감)")
    @Column(name = "save_amt", nullable = false)
    private Long saveAmt;

    @Comment("처리 후 잔액")
    @Column(name = "balance_amt")
    private Long balanceAmt;

    @Comment("연관유형 (ORDER/EVENT/ADMIN 등)")
    @Column(name = "ref_type_cd", length = 30)
    @Size(max = 30, message = "refTypeCd 는 30자 이내여야 합니다.")
    private String refTypeCd;

    @Comment("연관ID")
    @Column(name = "ref_id", length = 21)
    @Size(max = 21, message = "refId 는 21자 이내여야 합니다.")
    private String refId;

    @Comment("소멸예정일")
    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    @Comment("메모")
    @Column(name = "save_memo", columnDefinition = "TEXT")
    @Size(max = 500000, message = "saveMemo 는 500,000자 이내여야 합니다.")
    private String saveMemo;

    @Comment("시뮬데이터여부 (Y/N)")
    @Column(name = "simul_yn", length = 1, columnDefinition = "VARCHAR(1) DEFAULT 'N'")
    @Size(max = 1, message = "simulYn 는 1자 이내여야 합니다.")
    private String simulYn;

}
