package com.shopjoy.ecBeBo.md.cb.data.entity;

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
@Table(name = "md_cb_pattern", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("코바늘 도안 마스터")
public class MdCbPattern extends BaseEntity {

    @Id
    @Comment("도안ID (YYMMDDhhmmss+rand4)")
    @Column(name = "pattern_id", length = 21, nullable = false)
    @Size(max = 21, message = "patternId 는 21자 이내여야 합니다.")
    private String patternId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("작성 회원ID (mb_member.member_id, NULL=관리자 작성)")
    @Column(name = "member_id", length = 21)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("도안명")
    @Column(name = "pattern_nm", length = 200, nullable = false)
    @Size(max = 200, message = "patternNm 는 200자 이내여야 합니다.")
    private String patternNm;

    @Comment("도안 설명")
    @Column(name = "pattern_desc", length = 500)
    @Size(max = 500, message = "patternDesc 는 500자 이내여야 합니다.")
    private String patternDesc;

    @Comment("총 단수 (격자 세로 길이)")
    @Column(name = "row_count")
    private Integer rowCount;

    @Comment("최대 코수 (격자 가로 길이)")
    @Column(name = "max_stitch_count")
    private Integer maxStitchCount;

    @Comment("격자로부터 생성된 한글 도안 설명 (자동생성 결과 캐시, 저장 시 갱신)")
    @Column(name = "desc_text", columnDefinition = "TEXT")
    private String descText;

    @Comment("원형(라운드) 도안 입력 텍스트 (원형뜨기 전용 별도 입력, 사각형 격자와 독립)")
    @Column(name = "round_desc_text", columnDefinition = "TEXT")
    private String roundDescText;

    @Comment("썸네일 이미지 URL")
    @Column(name = "thumbnail_url", length = 500)
    @Size(max = 500, message = "thumbnailUrl 는 500자 이내여야 합니다.")
    private String thumbnailUrl;

    @Comment("상태 (코드: CB_PATTERN_STATUS_CD)")
    @Column(name = "pattern_status_cd", length = 20)
    @Size(max = 20, message = "patternStatusCd 는 20자 이내여야 합니다.")
    private String patternStatusCd;

    @Comment("사용여부 Y/N (삭제 대체 플래그)")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;
}
