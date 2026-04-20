package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_i18n_msg", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 다국어 메시지 엔티티
public class SyI18nMsg {

    @Id
    @Column(name = "i18n_msg_id", length = 20, nullable = false)
    private String i18nMsgId;

    @Column(name = "i18n_id", length = 20, nullable = false)
    private String i18nId;

    @Column(name = "lang_cd", length = 10, nullable = false)
    private String langCd;

    @Lob
    @Column(name = "i18n_msg", columnDefinition = "TEXT")
    private String i18nMsg;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}