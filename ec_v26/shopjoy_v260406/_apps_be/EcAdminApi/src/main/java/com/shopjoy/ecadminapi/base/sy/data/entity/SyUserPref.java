package com.shopjoy.ecadminapi.base.sy.data.entity;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_user_pref", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("관리자 사용자 개인화 설정")
public class SyUserPref extends BaseEntity {

    /* 대리키 PK — (user_id, pref_key) @EmbeddedId 복합키였으나 정책에 따라 단일 PK + UNIQUE 로 전환.
       유일성은 sy_user_pref_uk_user_id_pref_key_x2 가 계속 보장한다. */
    @Id
    @Comment("사용자환경설정ID (PK)")
    @Column(name = "user_pref_id", length = 21, nullable = false)
    private String userPrefId;

    @Comment("관리자 사용자ID (sy_user.user_id)")
    @Column(name = "user_id", length = 21, nullable = false)
    private String userId;

    @Comment("설정 키 (예: ui.left_menu_open)")
    @Column(name = "pref_key", length = 100, nullable = false)
    private String prefKey;

    @Comment("설정 값 (예: true / false)")
    @Column(name = "pref_value", columnDefinition = "text")
    private String prefValue;
}
