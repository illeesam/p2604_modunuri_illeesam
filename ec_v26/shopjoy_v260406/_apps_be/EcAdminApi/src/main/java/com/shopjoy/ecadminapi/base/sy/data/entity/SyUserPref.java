package com.shopjoy.ecadminapi.base.sy.data.entity;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

import java.io.Serializable;

@Entity
@Table(name = "sy_user_pref", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("관리자 사용자 개인화 설정")
public class SyUserPref extends BaseEntity {

    @EmbeddedId
    private SyUserPrefId id;

    @Comment("설정 값 (예: true / false)")
    @Column(name = "pref_value", columnDefinition = "text")
    private String prefValue;

    @Embeddable
    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @EqualsAndHashCode
    public static class SyUserPrefId implements Serializable {

        @Comment("관리자 사용자ID (sy_user.user_id)")
        @Column(name = "user_id", length = 21, nullable = false)
        private String userId;

        @Comment("설정 키 (예: ui.left_menu_open)")
        @Column(name = "pref_key", length = 100, nullable = false)
        private String prefKey;
    }
}
