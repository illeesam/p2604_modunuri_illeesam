package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "mb_member_group", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 회원 그룹 엔티티
@Comment("회원그룹")
public class MbMemberGroup extends BaseEntity {

    @Id
    @Comment("그룹ID (YYMMDDhhmmss+rand4)")
    @Column(name = "member_group_id", length = 21, nullable = false)
    private String memberGroupId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("그룹명")
    @Column(name = "group_nm", length = 100, nullable = false)
    private String groupNm;

    @Comment("메모")
    @Column(name = "group_memo", columnDefinition = "TEXT")
    private String groupMemo;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
