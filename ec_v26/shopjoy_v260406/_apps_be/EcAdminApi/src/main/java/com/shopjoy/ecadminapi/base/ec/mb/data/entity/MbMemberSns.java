package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

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
    private String memberSnsId;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("SNS채널코드 (코드: SNS_CHANNEL)")
    @Column(name = "sns_channel_cd", length = 20, nullable = false)
    private String snsChannelCd;

    @Comment("SNS 플랫폼 사용자ID")
    @Column(name = "sns_user_id", length = 200, nullable = false)
    private String snsUserId;

}
