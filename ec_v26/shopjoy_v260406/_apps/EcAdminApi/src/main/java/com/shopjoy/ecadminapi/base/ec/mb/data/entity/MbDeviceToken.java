package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mb_device_token", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class MbDeviceToken {

    @Id
    @Column(name = "device_token_id", length = 21, nullable = false)
    private String deviceTokenId;

    @Column(name = "device_token", length = 200, nullable = false)
    private String deviceToken;

    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "os_type", length = 10)
    private String osType;

    @Column(name = "benefit_noti_yn", length = 1)
    private String benefitNotiYn;

    @Column(name = "alim_read_date")
    private LocalDateTime alimReadDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}
