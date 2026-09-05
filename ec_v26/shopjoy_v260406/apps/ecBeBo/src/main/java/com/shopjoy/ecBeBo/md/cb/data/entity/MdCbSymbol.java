package com.shopjoy.ecadminapi.md.cb.data.entity;

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
@Table(name = "md_cb_symbol", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("코바늘 도안 기호 사전 (참조 데이터)")
public class MdCbSymbol extends BaseEntity {

    @Id
    @Comment("기호ID (YYMMDDhhmmss+rand4)")
    @Column(name = "symbol_id", length = 21, nullable = false)
    @Size(max = 21, message = "symbolId 는 21자 이내여야 합니다.")
    private String symbolId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("기호코드 (UNIQUE, 예: CHAIN/SLIP/SC/HDC/DC/TR/INC/DEC)")
    @Column(name = "symbol_cd", length = 30, nullable = false)
    @Size(max = 30, message = "symbolCd 는 30자 이내여야 합니다.")
    private String symbolCd;

    @Comment("기호명 (한글, 예: 사슬뜨기/짧은뜨기/한길긴뜨기)")
    @Column(name = "symbol_nm", length = 100, nullable = false)
    @Size(max = 100, message = "symbolNm 는 100자 이내여야 합니다.")
    private String symbolNm;

    @Comment("격자에 표시할 기호 문자(유니코드 기호 1~2자)")
    @Column(name = "symbol_char", length = 10, nullable = false)
    @Size(max = 10, message = "symbolChar 는 10자 이내여야 합니다.")
    private String symbolChar;

    @Comment("기호 설명 (뜨는 방법 요약)")
    @Column(name = "symbol_desc", length = 300)
    @Size(max = 300, message = "symbolDesc 는 300자 이내여야 합니다.")
    private String symbolDesc;

    @Comment("이 기호 1개가 소모하는 전단 코 수 (기본 1, 짧은뜨기2코모아뜨기=2)")
    @Column(name = "stitch_consume")
    private Integer stitchConsume;

    @Comment("이 기호 1개가 생성하는 코 수 (기본 1, 두길긴뜨기2코=2)")
    @Column(name = "stitch_produce")
    private Integer stitchProduce;

    @Comment("기호 팔레트 표시 정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;
}
