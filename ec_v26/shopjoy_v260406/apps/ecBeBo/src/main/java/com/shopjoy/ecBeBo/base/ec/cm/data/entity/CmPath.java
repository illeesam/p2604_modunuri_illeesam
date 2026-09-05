package com.shopjoy.ecBeBo.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "cm_path", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 경로(메뉴/URL) 엔티티
@Comment("경로 (업무별 트리)")
public class CmPath extends BaseEntity {

    @Id
    @Comment("업무코드 (참조 테이블명, 예: sy_brand / sy_code_grp / ec_prop)")
    @Column(name = "biz_cd", length = 50, nullable = false)
    @Size(max = 50, message = "bizCd 는 50자 이내여야 합니다.")
    private String bizCd;


    @Comment("부모 경로ID (sy_path., 루트는 NULL)")
    @Column(name = "parent_path_id")
    private Long parentPathId;

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
