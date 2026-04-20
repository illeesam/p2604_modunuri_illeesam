package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mb_sns_member", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// SNS 연동 회원 엔티티
public class MbSnsMember {

    @Id
    @Column(name = "sns_mem_id", length = 21, nullable = false)
    private String snsMemId;

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