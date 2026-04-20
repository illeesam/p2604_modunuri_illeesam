package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cm_chatt_msg", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 채팅 메시지 엔티티
public class CmChattMsg {

    @Id
    @Column(name = "msg_id", length = 21, nullable = false)
    private String msgId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "chatt_id", length = 21, nullable = false)
    private String chattId;

    @Column(name = "sender_cd", length = 20, nullable = false)
    private String senderCd;

    @Lob
    @Column(name = "msg_text", columnDefinition = "TEXT")
    private String msgText;

    @Column(name = "ref_type", length = 20)
    private String refType;

    @Column(name = "ref_id", length = 21)
    private String refId;

    @Column(name = "send_date")
    private LocalDateTime sendDate;

    @Column(name = "read_yn", length = 1)
    private String readYn;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}