package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "memberGroupId 는 21자 이내여야 합니다.")
    private String memberGroupId;


    @Comment("그룹명")
    @Column(name = "group_nm", length = 100, nullable = false)
    @Size(max = 100, message = "groupNm 는 100자 이내여야 합니다.")
    private String groupNm;

    @Comment("메모")
    @Column(name = "group_memo", columnDefinition = "TEXT")
    @Size(max = 500000, message = "groupMemo 는 500,000자 이내여야 합니다.")
    private String groupMemo;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

}
