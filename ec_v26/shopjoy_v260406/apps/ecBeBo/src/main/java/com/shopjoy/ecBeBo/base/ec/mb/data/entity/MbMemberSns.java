package com.shopjoy.ecBeBo.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "mb_member_sns", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// SNS 연동 회원 엔티티
@Comment("회원 SNS 연동")
public class MbMemberSns extends BaseEntity {

    @Id
    @Comment("SNS연동ID (YYMMDDhhmmss+rand4)")
    @Column(name = "member_sns_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberSnsId 는 21자 이내여야 합니다.")
    private String memberSnsId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("SNS채널코드 (코드: SNS_CHANNEL_CD)")
    @Column(name = "sns_channel_cd", length = 20, nullable = false)
    @Size(max = 20, message = "snsChannelCd 는 20자 이내여야 합니다.")
    private String snsChannelCd;

    @Comment("SNS 플랫폼 사용자ID")
    @Column(name = "sns_user_id", length = 200, nullable = false)
    @Size(max = 200, message = "snsUserId 는 200자 이내여야 합니다.")
    private String snsUserId;

}
