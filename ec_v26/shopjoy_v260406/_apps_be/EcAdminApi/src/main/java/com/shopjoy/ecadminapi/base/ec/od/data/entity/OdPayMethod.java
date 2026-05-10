package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "od_pay_method", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 결제수단 엔티티
public class OdPayMethod extends BaseEntity {

    @Id
    @Column(name = "pay_method_id", length = 21, nullable = false)
    private String payMethodId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "pay_method_type_cd", length = 20, nullable = false)
    private String payMethodTypeCd;

    @Column(name = "pay_method_nm", length = 100, nullable = false)
    private String payMethodNm;

    @Column(name = "pay_method_alias", length = 100)
    private String payMethodAlias;

    @Column(name = "pay_key_no", length = 200)
    private String payKeyNo;

    @Column(name = "main_method_yn", length = 1)
    private String mainMethodYn;

}
