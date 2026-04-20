package com.shopjoy.ecadminapi.base.ec.mb.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mb_dvc_token", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 디바이스 토큰 엔티티
public class MbDvcToken {

    @Id
    @Column(name = "device_token", length = 200, nullable = false)
    private String deviceToken;

    @Id
    @Column(name = "site_id", length = 20, nullable = false)
    private String siteId;

    @Column(name = "member_id", length = 20)
    private String memberId;

    @Column(name = "os_type", length = 10)
    private String osType;

    @Column(name = "benefit_noti_yn", length = 1)
    private String benefitNotiYn;

    @Column(name = "alim_read_date")
    private LocalDateTime alimReadDate;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}