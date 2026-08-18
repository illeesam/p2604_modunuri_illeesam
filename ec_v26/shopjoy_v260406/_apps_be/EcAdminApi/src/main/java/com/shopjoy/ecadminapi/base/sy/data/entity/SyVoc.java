package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "sy_voc", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 고객의 소리(VOC) 엔티티
@Comment("고객의소리 VOC 분류")
public class SyVoc extends BaseEntity {

    @Id
    @Comment("VOC분류ID (YYMMDDhhmmss+rand4)")
    @Column(name = "voc_id", length = 21, nullable = false)
    @Size(max = 21, message = "vocId 는 21자 이내여야 합니다.")
    private String vocId;


    @Comment("VOC마스터코드 (코드: VOC_MASTER_CD)")
    @Column(name = "voc_master_cd", length = 20, nullable = false)
    @Size(max = 20, message = "vocMasterCd 는 20자 이내여야 합니다.")
    private String vocMasterCd;

    @Comment("VOC세부코드 (코드: VOC_DETAIL_CD)")
    @Column(name = "voc_detail_cd", length = 20, nullable = false)
    @Size(max = 20, message = "vocDetailCd 는 20자 이내여야 합니다.")
    private String vocDetailCd;

    @Comment("VOC항목명")
    @Column(name = "voc_nm", length = 100, nullable = false)
    @Size(max = 100, message = "vocNm 는 100자 이내여야 합니다.")
    private String vocNm;

    @Comment("VOC항목설명")
    @Column(name = "voc_content", columnDefinition = "TEXT")
    @Size(max = 50000, message = "vocContent 는 50000자 이내여야 합니다.")
    private String vocContent;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

}
