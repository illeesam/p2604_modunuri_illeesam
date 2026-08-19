package com.shopjoy.ecadminapi.base.sy.data.entity;

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
@Table(name = "sy_noti", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 알림함 엔티티 — 수신자별 알림 1건 = 1행
@Comment("알림함 (수신자별 알림 1건 = 1행)")
public class SyNoti extends BaseEntity {

    @Id
    @Comment("알림ID (YYMMDDhhmmss+rand4)")
    @Column(name = "noti_id", length = 21, nullable = false)
    @Size(max = 21, message = "notiId 는 21자 이내여야 합니다.")
    private String notiId;

    @Comment("수신자유형 (MEMBER: 쇼핑몰 회원 / USER: 관리자 사용자)")
    @Column(name = "recv_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "recvTypeCd 는 20자 이내여야 합니다.")
    private String recvTypeCd;

    @Comment("수신자ID (MEMBER=mb_member.member_id / USER=sy_user.user_id)")
    @Column(name = "recv_id", length = 21, nullable = false)
    @Size(max = 21, message = "recvId 는 21자 이내여야 합니다.")
    private String recvId;

    @Comment("수신자명 (발송 시점 스냅샷)")
    @Column(name = "recv_nm", length = 100)
    @Size(max = 100, message = "recvNm 는 100자 이내여야 합니다.")
    private String recvNm;

    @Comment("알림유형 (NOTICE: 공지사항 / ALARM: 수신알림 / SPECIAL: 특이사항)")
    @Column(name = "noti_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "notiTypeCd 는 20자 이내여야 합니다.")
    private String notiTypeCd;

    @Comment("발송채널 (mail/sms/kakao/chat/notice)")
    @Column(name = "channel_cd", length = 20)
    @Size(max = 20, message = "channelCd 는 20자 이내여야 합니다.")
    private String channelCd;

    @Comment("알림 제목")
    @Column(name = "noti_title", length = 300, nullable = false)
    @Size(max = 100, message = "notiTitle 는 100자 이내여야 합니다.")
    private String notiTitle;

    @Comment("알림 내용")
    @Column(name = "noti_content", columnDefinition = "TEXT")
    @Size(max = 500000, message = "notiContent 는 500,000자 이내여야 합니다.")
    private String notiContent;

    @Comment("클릭 시 이동할 화면 pageId")
    @Column(name = "link_page", length = 100)
    @Size(max = 100, message = "linkPage 는 100자 이내여야 합니다.")
    private String linkPage;

    @Comment("참조ID (공지ID/주문ID 등)")
    @Column(name = "ref_id", length = 21)
    @Size(max = 21, message = "refId 는 21자 이내여야 합니다.")
    private String refId;

    @Comment("읽음여부 Y/N")
    @Column(name = "read_yn", length = 1)
    @Size(max = 1, message = "readYn 는 1자 이내여야 합니다.")
    private String readYn;

    @Comment("읽은일시")
    @Column(name = "read_date")
    private LocalDateTime readDate;

}
