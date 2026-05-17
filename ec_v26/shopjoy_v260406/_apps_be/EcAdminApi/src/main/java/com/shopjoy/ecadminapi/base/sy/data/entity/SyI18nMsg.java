package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_i18n_msg", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 다국어 메시지 엔티티
@Comment("다국어 메시지 (언어별)")
public class SyI18nMsg extends BaseEntity {

    @Id
    @Comment("다국어 메시지ID (YYMMDDhhmmss+rand4)")
    @Column(name = "i18n_msg_id", length = 21, nullable = false)
    private String i18nMsgId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("다국어ID (sy_i18n.i18n_id)")
    @Column(name = "i18n_id", length = 21, nullable = false)
    private String i18nId;

    @Comment("언어코드 (코드: LANG_CODE — ko/en/ja/in)")
    @Column(name = "lang_cd", length = 10, nullable = false)
    private String langCd;

    @Comment("번역 메시지 (플레이스홀더: {0},{1} 지원)")
    @Column(name = "i18n_msg", columnDefinition = "TEXT")
    private String i18nMsg;

}
