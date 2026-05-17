package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_path", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("경로 (업무별 트리)")
public class SyPath extends BaseEntity {

    @Id
    @Comment("경로ID (PK, auto)")
    @Column(name = "path_id", length = 21)
    private String pathId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("업무코드 (참조 테이블명, 예: sy_brand / sy_code_grp / sy_prop)")
    @Column(name = "biz_cd", length = 50, nullable = false)
    private String bizCd;

    @Comment("부모 경로ID (sy_path.path_id, 루트는 NULL)")
    @Column(name = "parent_path_id", length = 21)
    private String parentPathId;

    @Comment("경로 라벨 (한글 표시명)")
    @Column(name = "path_label", length = 200, nullable = false)
    private String pathLabel;

    @Comment("동일 부모 내 정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("비고")
    @Column(name = "path_remark", length = 500)
    private String pathRemark;

}
