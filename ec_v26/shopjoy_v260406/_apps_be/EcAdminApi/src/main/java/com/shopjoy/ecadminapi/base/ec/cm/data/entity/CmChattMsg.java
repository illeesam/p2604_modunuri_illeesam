package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "cm_chatt_msg", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 채팅 메시지 엔티티
@Comment("채팅 메시지")
public class CmChattMsg extends BaseEntity {

    @Id
    @Comment("메시지ID (YYMMDDhhmmss+rand4)")
    @Column(name = "chatt_msg_id", length = 21, nullable = false)
    private String chattMsgId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("채팅방ID")
    @Column(name = "chatt_room_id", length = 21, nullable = false)
    private String chattRoomId;

    @Comment("발신자유형 (MEMBER/ADMIN)")
    @Column(name = "sender_cd", length = 20, nullable = false)
    private String senderCd;

    @Comment("메시지내용")
    @Column(name = "msg_text", columnDefinition = "TEXT")
    private String msgText;

    @Comment("참조유형 (ORDER/PRODUCT/CLAIM)")
    @Column(name = "ref_type", length = 20)
    private String refType;

    @Comment("참조ID")
    @Column(name = "ref_id", length = 21)
    private String refId;

    @Comment("발송일시")
    @Column(name = "send_date")
    private LocalDateTime sendDate;

    @Comment("읽음여부 Y/N")
    @Column(name = "read_yn", length = 1)
    private String readYn;

}
