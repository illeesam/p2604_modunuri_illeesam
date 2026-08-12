package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_i18n", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 다국어 엔티티
@Comment("다국어 키 마스터")
public class SyI18n extends BaseEntity {

    @Id
    @Comment("다국어ID (YYMMDDhhmmss+rand4)")
    @Column(name = "i18n_id", length = 21, nullable = false)
    private String i18nId;


    @Comment("다국어 키 (예: common.bt.save, error.FORBIDDEN)")
    @Column(name = "i18n_key", length = 200, nullable = false)
    private String i18nKey;

    @Comment("키 설명 (번역자 참고용)")
    @Column(name = "i18n_desc", length = 200)
    private String i18nDesc;

    @Comment("적용범위 (코드: I18N_SCOPE — FO/BO/COMMON)")
    @Column(name = "i18n_scope_cd", length = 20)
    private String i18nScopeCd;

    @Comment("키 첫 세그먼트 (common/error/link/paging 등)")
    @Column(name = "i18n_category", length = 50)
    private String i18nCategory;

    /* ── 언어별 메시지 (2026-08-13 sy_i18n_msg 통합) ──────────────────────
       지원 언어 4종 고정: 한국어/영어/중국어/일본어.
       언어를 추가하려면 컬럼을 늘려야 한다(행 추가가 아님) — sy.58 §7 참조. */

    @Comment("한국어 메시지 (플레이스홀더 {0},{1} 지원)")
    @Column(name = "i18n_msg_ko", length = 500, nullable = false)
    private String i18nMsgKo;

    @Comment("영어 메시지 (플레이스홀더 {0},{1} 지원)")
    @Column(name = "i18n_msg_en", length = 500)
    private String i18nMsgEn;

    @Comment("중국어 메시지 (플레이스홀더 {0},{1} 지원)")
    @Column(name = "i18n_msg_cn", length = 500)
    private String i18nMsgCn;

    @Comment("일본어 메시지 (플레이스홀더 {0},{1} 지원)")
    @Column(name = "i18n_msg_ja", length = 500)
    private String i18nMsgJa;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
