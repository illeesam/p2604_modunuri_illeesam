package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cm_chatt_room", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 채팅방 엔티티
public class CmChattRoom {

    @Id
    @Column(name = "chatt_room_id", length = 21, nullable = false)
    private String chattRoomId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Column(name = "admin_user_id", length = 21)
    private String adminUserId;

    @Column(name = "subject", length = 200)
    private String subject;

    @Column(name = "chatt_status_cd", length = 20)
    private String chattStatusCd;

    @Column(name = "chatt_status_cd_before", length = 20)
    private String chattStatusCdBefore;

    @Column(name = "last_msg_date")
    private LocalDateTime lastMsgDate;

    @Column(name = "member_unread_cnt")
    private Integer memberUnreadCnt;

    @Column(name = "admin_unread_cnt")
    private Integer adminUnreadCnt;

    @Lob
    @Column(name = "chatt_memo", columnDefinition = "TEXT")
    private String chattMemo;

    @Column(name = "close_date")
    private LocalDateTime closeDate;

    @Column(name = "close_reason", length = 200)
    private String closeReason;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}