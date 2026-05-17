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
@Table(name = "cm_chatt_room", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 채팅방 엔티티
@Comment("고객 1:1 채팅 상담")
public class CmChattRoom extends BaseEntity {

    @Id
    @Comment("채팅방ID (YYMMDDhhmmss+rand4)")
    @Column(name = "chatt_room_id", length = 21, nullable = false)
    private String chattRoomId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("회원ID (고객)")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("회원명")
    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Comment("담당관리자 (sy_user.user_id)")
    @Column(name = "admin_user_id", length = 21)
    private String adminUserId;

    @Comment("채팅주제")
    @Column(name = "subject", length = 200)
    private String subject;

    @Comment("상태 (코드: CHATT_STATUS)")
    @Column(name = "chatt_status_cd", length = 20)
    private String chattStatusCd;

    @Comment("변경 전 채팅상태 (코드: CHATT_STATUS)")
    @Column(name = "chatt_status_cd_before", length = 20)
    private String chattStatusCdBefore;

    @Comment("마지막 메시지 일시")
    @Column(name = "last_msg_date")
    private LocalDateTime lastMsgDate;

    @Comment("고객 미읽메시지 수")
    @Column(name = "member_unread_cnt")
    private Integer memberUnreadCnt;

    @Comment("관리자 미읽메시지 수")
    @Column(name = "admin_unread_cnt")
    private Integer adminUnreadCnt;

    @Comment("메모")
    @Column(name = "chatt_memo", columnDefinition = "TEXT")
    private String chattMemo;

    @Comment("종료일시")
    @Column(name = "close_date")
    private LocalDateTime closeDate;

    @Comment("종료사유")
    @Column(name = "close_reason", length = 200)
    private String closeReason;

}
