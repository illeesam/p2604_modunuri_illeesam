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
@Table(name = "cm_chatt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("채팅 방")
public class CmChatt extends BaseEntity {

    @Id
    @Comment("채팅방ID (YYMMDDhhmmss+rand4)")
    @Column(name = "chatt_id", length = 21, nullable = false)
    private String chattId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("채팅주제")
    @Column(name = "subject", length = 200)
    private String subject;

    @Comment("상태 (PENDING/OPEN/CLOSED)")
    @Column(name = "chatt_status_cd", length = 20)
    private String chattStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "chatt_status_cd_before", length = 20)
    private String chattStatusCdBefore;

    @Comment("마지막 메시지 일시")
    @Column(name = "last_msg_date")
    private LocalDateTime lastMsgDate;

    @Comment("관리자 메모")
    @Column(name = "chatt_memo", columnDefinition = "TEXT")
    private String chattMemo;

    @Comment("종료일시")
    @Column(name = "close_date")
    private LocalDateTime closeDate;

    @Comment("종료사유")
    @Column(name = "close_reason", length = 200)
    private String closeReason;
}
