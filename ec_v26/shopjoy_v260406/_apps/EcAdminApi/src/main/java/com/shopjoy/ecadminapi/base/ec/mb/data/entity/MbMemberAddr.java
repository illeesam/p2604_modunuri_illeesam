package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mb_member_addr", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 회원 주소 엔티티
public class MbMemberAddr {

    @Id
    @Column(name = "addr_id", length = 21, nullable = false)
    private String addrId;

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

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}