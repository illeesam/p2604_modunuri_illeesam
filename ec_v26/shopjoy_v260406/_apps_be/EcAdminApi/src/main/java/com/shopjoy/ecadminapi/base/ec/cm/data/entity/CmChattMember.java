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
@Table(name = "cm_chatt_member", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("채팅 참여자")
public class CmChattMember extends BaseEntity {

    @Id
    @Comment("참여자ID (YYMMDDhhmmss+rand4)")
    @Column(name = "chatt_member_id", length = 21, nullable = false)
    private String chattMemberId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("채팅방ID (cm_chatt.chatt_id)")
    @Column(name = "chatt_id", length = 21, nullable = false)
    private String chattId;

    @Comment("참여자유형 (MEMBER/ADMIN)")
    @Column(name = "member_type_cd", length = 20, nullable = false)
    private String memberTypeCd;

    @Comment("참조ID (mb_member.member_id 또는 sy_user.user_id)")
    @Column(name = "ref_id", length = 21, nullable = false)
    private String refId;

    @Comment("참여자명 (비정규화 캐시)")
    @Column(name = "ref_nm", length = 100)
    private String refNm;

    @Comment("미읽음 메시지 수")
    @Column(name = "unread_cnt")
    private Integer unreadCnt;

    @Comment("참여일시")
    @Column(name = "join_date")
    private LocalDateTime joinDate;

    @Comment("퇴장일시 (NULL=현재 참여중)")
    @Column(name = "leave_date")
    private LocalDateTime leaveDate;
}
