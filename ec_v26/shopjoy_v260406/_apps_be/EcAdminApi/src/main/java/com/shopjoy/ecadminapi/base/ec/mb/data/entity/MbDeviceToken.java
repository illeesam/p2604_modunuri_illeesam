package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "mb_device_token", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class MbDeviceToken extends BaseEntity {

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

}
