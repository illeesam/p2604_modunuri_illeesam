package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_i18n_msg", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 다국어 메시지 엔티티
public class SyI18nMsg extends BaseEntity {

    @Id
    @Column(name = "i18n_msg_id", length = 20, nullable = false)
    private String i18nMsgId;

    @Column(name = "i18n_id", length = 20, nullable = false)
    private String i18nId;

    @Column(name = "lang_cd", length = 10, nullable = false)
    private String langCd;

    @Column(name = "i18n_msg", columnDefinition = "TEXT")
    private String i18nMsg;

}
