package com.shopjoy.ecBeBo.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "sy_path", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("경로 (업무별 트리)")
public class SyPath extends BaseEntity {

    @Id
    @Comment("경로ID (PK, auto)")
    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;


    @Comment("업무코드 (참조 테이블명, 예: sy_brand / sy_code_grp / sy_prop)")
    @Column(name = "biz_cd", length = 50, nullable = false)
    @Size(max = 50, message = "bizCd 는 50자 이내여야 합니다.")
    private String bizCd;

    @Comment("부모 경로ID (sy_path.path_id, 루트는 NULL)")
    @Column(name = "parent_path_id", length = 21)
    @Size(max = 21, message = "parentPathId 는 21자 이내여야 합니다.")
    private String parentPathId;

    @Comment("경로 라벨 (한글 표시명)")
    @Column(name = "path_label", length = 200, nullable = false)
    @Size(max = 200, message = "pathLabel 는 200자 이내여야 합니다.")
    private String pathLabel;

    @Comment("동일 부모 내 정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("비고")
    @Column(name = "path_remark", length = 500)
    @Size(max = 500, message = "pathRemark 는 500자 이내여야 합니다.")
    private String pathRemark;

}
