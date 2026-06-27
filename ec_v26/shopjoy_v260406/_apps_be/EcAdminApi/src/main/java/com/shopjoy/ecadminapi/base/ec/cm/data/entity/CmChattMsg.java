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
@Comment("채팅 메시지")
public class CmChattMsg extends BaseEntity {

    @Id
    @Comment("메시지ID (YYMMDDhhmmss+rand4)")
    @Column(name = "chatt_msg_id", length = 21, nullable = false)
    private String chattMsgId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("채팅방ID (cm_chatt.chatt_id)")
    @Column(name = "chatt_id", length = 21, nullable = false)
    private String chattId;

    @Comment("발신자유형 (MEMBER/ADMIN/SYSTEM)")
    @Column(name = "sender_type_cd", length = 20, nullable = false)
    private String senderTypeCd;

    @Comment("발신자ID (memberId 또는 userId)")
    @Column(name = "sender_id", length = 21, nullable = false)
    private String senderId;

    @Comment("발신자명 (비정규화 캐시)")
    @Column(name = "sender_nm", length = 100)
    private String senderNm;

    @Comment("메시지 내용")
    @Column(name = "msg_text", columnDefinition = "TEXT")
    private String msgText;

    @Comment("메시지유형 (TEXT/IMAGE/FILE/REF/SYSTEM)")
    @Column(name = "msg_type_cd", length = 20)
    private String msgTypeCd;

    @Comment("첨부그룹ID (sy_attach_grp.attach_grp_id)")
    @Column(name = "attach_grp_id", length = 21)
    private String attachGrpId;

    @Comment("참조유형 (ORDER/PRODUCT/CLAIM)")
    @Column(name = "ref_type", length = 20)
    private String refType;

    @Comment("참조ID")
    @Column(name = "ref_id", length = 21)
    private String refId;

    @Comment("읽음여부 (Y/N)")
    @Column(name = "read_yn", length = 1)
    private String readYn;

    @Comment("발송일시")
    @Column(name = "send_date")
    private LocalDateTime sendDate;
}
