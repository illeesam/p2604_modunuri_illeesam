package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

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
@Table(name = "mb_member_grade", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 회원 등급 엔티티
@Comment("회원등급")
public class MbMemberGrade extends BaseEntity {

    @Id
    @Comment("등급ID (YYMMDDhhmmss+rand4)")
    @Column(name = "member_grade_id", length = 21, nullable = false)
    private String memberGradeId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("등급코드 (코드: MEMBER_GRADE)")
    @Column(name = "grade_cd", length = 20, nullable = false)
    private String gradeCd;

    @Comment("등급명")
    @Column(name = "grade_nm", length = 50, nullable = false)
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
    private String useYn;

}
