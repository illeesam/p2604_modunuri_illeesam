package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "mb_device_token", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("앱 디바이스 토큰")
public class MbDeviceToken extends BaseEntity {

    @Id
    @Column(name = "device_token_id", length = 21, nullable = false)
    @Size(max = 21, message = "deviceTokenId 는 21자 이내여야 합니다.")
    private String deviceTokenId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("디바이스 토큰 키")
    @Column(name = "device_token", length = 200, nullable = false)
    @Size(max = 200, message = "deviceToken 는 200자 이내여야 합니다.")
    private String deviceToken;


    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("OS유형 ANDROID/IOS")
    @Column(name = "os_type_cd", length = 10)
    @Size(max = 10, message = "osTypeCd 는 10자 이내여야 합니다.")
    private String osTypeCd;

    @Comment("혜택알림수신여부 Y/N")
    @Column(name = "benefit_noti_yn", length = 1)
    @Size(max = 1, message = "benefitNotiYn 는 1자 이내여야 합니다.")
    private String benefitNotiYn;

    @Comment("알림리스트 읽음일시")
    @Column(name = "alim_read_date")
    private LocalDateTime alimReadDate;

}
