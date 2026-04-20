package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mb_member", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 회원 엔티티
public class MbMember {

    @Id
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_email", length = 100, nullable = false)
    private String memberEmail;

    @Column(name = "member_password", length = 255, nullable = false)
    private String memberPassword;

    @Column(name = "member_nm", length = 50, nullable = false)
    private String memberNm;

    @Column(name = "member_phone", length = 20)
    private String memberPhone;

    @Column(name = "member_gender", length = 1)
    private String memberGender;

    @Column(name = "birth_date")
    private LocalDate birthDate;

    @Column(name = "grade_cd", length = 20)
    private String gradeCd;

    @Column(name = "member_status_cd", length = 20)
    private String memberStatusCd;

    @Column(name = "member_status_cd_before", length = 20)
    private String memberStatusCdBefore;

    @Column(name = "join_date")
    private LocalDateTime joinDate;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "order_count")
    private Integer orderCount;

    @Column(name = "total_purchase_amt")
    private Long totalPurchaseAmt;

    @Column(name = "cache_balance_amt")
    private Long cacheBalanceAmt;

    @Column(name = "member_zip_code", length = 10)
    private String memberZipCode;

    @Column(name = "member_addr", length = 200)
    private String memberAddr;

    @Column(name = "member_addr_detail", length = 200)
    private String memberAddrDetail;

    @Lob
    @Column(name = "member_memo", columnDefinition = "TEXT")
    private String memberMemo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}