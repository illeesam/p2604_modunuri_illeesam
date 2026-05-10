package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "mb_member_addr", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 회원 주소 엔티티
public class MbMemberAddr extends BaseEntity {

    @Id
    @Column(name = "member_addr_id", length = 21, nullable = false)
    private String memberAddrId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "addr_nm", length = 50)
    private String addrNm;

    @Column(name = "recv_nm", length = 50, nullable = false)
    private String recvNm;

    @Column(name = "recv_phone", length = 20, nullable = false)
    private String recvPhone;

    @Column(name = "zip_cd", length = 10)
    private String zipCd;

    @Column(name = "addr", length = 200)
    private String addr;

    @Column(name = "addr_detail", length = 200)
    private String addrDetail;

    @Column(name = "is_default", length = 1)
    private String isDefault;

}
