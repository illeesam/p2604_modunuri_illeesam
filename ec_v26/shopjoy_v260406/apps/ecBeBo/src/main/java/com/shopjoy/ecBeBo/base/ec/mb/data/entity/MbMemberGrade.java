package com.shopjoy.ecBeBo.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "mb_member_grade", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 회원 등급 엔티티
@Comment("회원등급")
public class MbMemberGrade extends BaseEntity {

    @Id
    @Comment("등급ID (YYMMDDhhmmss+rand4)")
    @Column(name = "member_grade_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberGradeId 는 21자 이내여야 합니다.")
    private String memberGradeId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("등급코드 (코드: MEMBER_GRADE)")
    @Column(name = "grade_cd", length = 20, nullable = false)
    @Size(max = 20, message = "gradeCd 는 20자 이내여야 합니다.")
    private String gradeCd;

    @Comment("등급명")
    @Column(name = "grade_nm", length = 50, nullable = false)
    @Size(max = 50, message = "gradeNm 는 50자 이내여야 합니다.")
    private String gradeNm;

    @Comment("등급우선순위 (낮을수록 낮은 등급)")
    @Column(name = "grade_rank")
    private Integer gradeRank;

    @Comment("등급 유지 최소 누적구매금액")
    @Column(name = "min_purchase_amt")
    private Long minPurchaseAmt;

    @Comment("적립률 (%)")
    @Column(name = "save_rate")
    private BigDecimal saveRate;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

}
