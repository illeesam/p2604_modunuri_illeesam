package com.shopjoy.ecBeBo.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "mb_like", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 좋아요(찜) 엔티티
@Comment("좋아요 (위시리스트)")
public class MbLike extends BaseEntity {

    @Id
    @Comment("좋아요ID (YYMMDDhhmmss+rand4)")
    @Column(name = "like_id", length = 21, nullable = false)
    @Size(max = 21, message = "likeId 는 21자 이내여야 합니다.")
    private String likeId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("대상유형 (코드: LIKE_TARGET_TYPE — PRODUCT/BLOG/EVENT)")
    @Column(name = "target_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "targetTypeCd 는 20자 이내여야 합니다.")
    private String targetTypeCd;

    @Comment("대상ID")
    @Column(name = "target_id", length = 21, nullable = false)
    @Size(max = 21, message = "targetId 는 21자 이내여야 합니다.")
    private String targetId;

}
