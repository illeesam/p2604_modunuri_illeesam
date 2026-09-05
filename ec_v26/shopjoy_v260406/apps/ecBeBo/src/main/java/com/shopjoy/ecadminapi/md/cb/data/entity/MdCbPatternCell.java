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
@Table(name = "md_cb_pattern_cell", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("코바늘 도안 격자 셀 (단×코 위치별 기호/배색)")
public class MdCbPatternCell extends BaseEntity {

    @Id
    @Comment("셀ID (YYMMDDhhmmss+rand4)")
    @Column(name = "cell_id", length = 21, nullable = false)
    @Size(max = 21, message = "cellId 는 21자 이내여야 합니다.")
    private String cellId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("도안ID (cb_pattern.pattern_id)")
    @Column(name = "pattern_id", length = 21, nullable = false)
    @Size(max = 21, message = "patternId 는 21자 이내여야 합니다.")
    private String patternId;

    @Comment("단 번호 (세로 위치, 1부터)")
    @Column(name = "row_no", nullable = false)
    private Integer rowNo;

    @Comment("코 번호 (가로 위치, 1부터)")
    @Column(name = "col_no", nullable = false)
    private Integer colNo;

    @Comment("기호ID (cb_symbol.symbol_id)")
    @Column(name = "symbol_id", length = 21, nullable = false)
    @Size(max = 21, message = "symbolId 는 21자 이내여야 합니다.")
    private String symbolId;

    @Comment("이 셀의 배색 (예: #FF0000, NULL=기본 실색)")
    @Column(name = "color_hex", length = 7)
    @Size(max = 7, message = "colorHex 는 7자 이내여야 합니다.")
    private String colorHex;
}
