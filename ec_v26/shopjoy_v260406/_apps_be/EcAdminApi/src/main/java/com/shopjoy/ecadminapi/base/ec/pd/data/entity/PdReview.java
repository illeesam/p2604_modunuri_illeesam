package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import com.shopjoy.ecadminapi.base.sy.data.dto.AttachFile;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pd_review", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 리뷰 엔티티
@Comment("상품 리뷰")
public class PdReview extends BaseEntity {

    @Id
    @Comment("리뷰ID (YYMMDDhhmmss+rand4)")
    @Column(name = "review_id", length = 21, nullable = false)
    @Size(max = 21, message = "reviewId 는 21자 이내여야 합니다.")
    private String reviewId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("리뷰 제목")
    @Column(name = "review_title", length = 200, nullable = false)
    @NotBlank(message = "리뷰 제목을 입력해주세요.")
    @Size(max = 100, message = "리뷰 제목은 100자 이내로 입력해주세요.")
    private String reviewTitle;

    @Comment("리뷰 내용")
    @Column(name = "review_content", columnDefinition = "TEXT")
    @Size(max = 50000, message = "reviewContent 는 50000자 이내여야 합니다.")
    private String reviewContent;

    @Comment("평점 (1.0~5.0)")
    @Column(name = "rating", nullable = false)
    private BigDecimal rating;

    @Comment("도움이 돼요 수")
    @Column(name = "helpful_cnt")
    private Integer helpfulCnt;

    @Comment("도움이 안 돼요 수")
    @Column(name = "unhelpful_cnt")
    private Integer unhelpfulCnt;

    @Comment("상태 (코드: REVIEW_STATUS_CD)")
    @Column(name = "review_status_cd", length = 20)
    @Size(max = 20, message = "reviewStatusCd 는 20자 이내여야 합니다.")
    private String reviewStatusCd;

    @Comment("변경 전 리뷰상태 (코드: REVIEW_STATUS_CD)")
    @Column(name = "review_status_cd_before", length = 20)
    @Size(max = 20, message = "reviewStatusCdBefore 는 20자 이내여야 합니다.")
    private String reviewStatusCdBefore;

    @Comment("리뷰작성일")
    @Column(name = "review_date")
    private LocalDateTime reviewDate;

    /** 첨부파일 목록 — DB 컬럼 아님({@literal @}Transient). 요청 시엔 attachId/rowStatus(I/D) 만 채워 보내고,
     *  create()/update() 가 reviewId 확정 직후 같은 트랜잭션에서 sy_attach 에 반영한 뒤,
     *  같은 필드를 SyAttachService.getAttachFilesByRef() 결과로 덮어써 응답에 되돌려준다. */
    @Transient
    private List<AttachFile> attachFiles;

}
