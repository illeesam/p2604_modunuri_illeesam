package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "mb_like", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 좋아요(찜) 엔티티
public class MbLike extends BaseEntity {

    @Id
    @Column(name = "like_id", length = 21, nullable = false)
    private String likeId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "target_type_cd", length = 20, nullable = false)
    private String targetTypeCd;

    @Column(name = "target_id", length = 21, nullable = false)
    private String targetId;

}
