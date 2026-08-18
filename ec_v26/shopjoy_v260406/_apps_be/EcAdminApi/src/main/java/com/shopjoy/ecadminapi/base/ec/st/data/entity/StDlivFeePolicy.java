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

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "st_dliv_fee_policy", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 배송수수료정책 엔티티
@Comment("배송수수료정책 - 배송방법(DLIV_METHOD_CD)별 플랫폼 수수료율/정액")
public class StDlivFeePolicy extends BaseEntity {

    @Id
    @Comment("배송수수료정책ID (YYMMDDhhmmss+rand4)")
    @Column(name = "dliv_fee_policy_id", length = 21, nullable = false)
    @Size(max = 21, message = "dlivFeePolicyId 는 21자 이내여야 합니다.")
    private String dlivFeePolicyId;


    @Comment("배송방법 (코드: DLIV_METHOD_CD)")
    @Column(name = "dliv_method_cd", length = 30, nullable = false)
    @Size(max = 30, message = "dlivMethodCd 는 30자 이내여야 합니다.")
    private String dlivMethodCd;

    @Comment("수수료율(%) - fee_amt 와 동시 사용 가능(정률+정액 가산)")
    @Column(name = "fee_rate")
    private BigDecimal feeRate;

    @Comment("수수료 정액(원)")
    @Column(name = "fee_amt")
    private Long feeAmt;

    @Comment("사이트ID - 사이트별 배송수수료 차등 적용")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1, nullable = false)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("비고")
    @Column(name = "remark", length = 500)
    @Size(max = 100, message = "remark 는 100자 이내여야 합니다.")
    private String remark;

}
