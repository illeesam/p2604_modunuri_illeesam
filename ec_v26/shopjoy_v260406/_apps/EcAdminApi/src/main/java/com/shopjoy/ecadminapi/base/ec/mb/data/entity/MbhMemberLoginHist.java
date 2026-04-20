package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mbh_member_login_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 회원 로그인 이력 엔티티
public class MbhMemberLoginHist {

    @Id
    @Column(name = "login_hist_id", length = 21, nullable = false)
    private String loginHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "login_date")
    private LocalDateTime loginDate;

    @Column(name = "ip", length = 50)
    private String ip;

    @Column(name = "device", length = 100)
    private String device;

    @Column(name = "result_cd", length = 20)
    private String resultCd;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}