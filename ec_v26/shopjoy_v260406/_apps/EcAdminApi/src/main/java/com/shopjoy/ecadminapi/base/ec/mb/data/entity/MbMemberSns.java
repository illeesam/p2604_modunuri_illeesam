package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "mb_member_sns", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// SNS 연동 회원 엔티티
public class MbMemberSns {

    @Id
    @Column(name = "member_sns_id", length = 21, nullable = false)
    private String memberSnsId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "sns_channel_cd", length = 20, nullable = false)
    private String snsChannelCd;

    @Column(name = "sns_user_id", length = 200, nullable = false)
    private String snsUserId;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}
