package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "syh_user_login_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 사용자 로그인 이력 엔티티
public class SyhUserLoginHist {

    @Id
    @Column(name = "login_hist_id", length = 21, nullable = false)
    private String loginHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "user_id", length = 21, nullable = false)
    private String userId;

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