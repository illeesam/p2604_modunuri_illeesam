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
@Table(name = "sy_attach_grp", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 첨부파일 그룹 엔티티
@Comment("첨부파일 그룹 - 여러 파일을 한 번에 관리하기 위한 그룹 단위")
public class SyAttachGrp extends BaseEntity {

    @Id
    @Comment("파일 그룹 ID (ATG + timestamp + random)")
    @Column(name = "attach_grp_id", length = 21, nullable = false)
    private String attachGrpId;

    @Comment("그룹 코드 (businessCode + \"_\" + timestamp)")
    @Column(name = "attach_grp_code", length = 50, nullable = false)
    private String attachGrpCode;

    @Comment("그룹 이름 (사용자에게 표시되는 이름)")
    @Column(name = "attach_grp_nm", length = 100, nullable = false)
    private String attachGrpNm;

    @Comment("허용 확장자 목록")
    @Column(name = "file_ext_allow", length = 200)
    private String fileExtAllow;

    @Comment("그룹 내 단일 파일 최대 크기")
    @Column(name = "max_file_size")
    private Long maxFileSize;

    @Comment("그룹 내 최대 파일 개수")
    @Column(name = "max_file_count")
    private Integer maxFileCount;

    @Column(name = "storage_path", length = 300)
    private String storagePath;

    @Comment("사용 여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "attach_grp_remark", length = 500)
    private String attachGrpRemark;

}
