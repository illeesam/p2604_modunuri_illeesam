package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "mb_member_group", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 회원 그룹 엔티티
public class MbMemberGroup extends BaseEntity {

    @Id
    @Column(name = "member_group_id", length = 21, nullable = false)
    private String memberGroupId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "group_nm", length = 100, nullable = false)
    private String groupNm;

    @Column(name = "group_memo", columnDefinition = "TEXT")
    private String groupMemo;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
