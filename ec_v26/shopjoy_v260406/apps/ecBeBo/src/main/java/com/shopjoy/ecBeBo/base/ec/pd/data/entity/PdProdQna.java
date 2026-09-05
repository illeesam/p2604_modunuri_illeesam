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

import java.time.LocalDateTime;
import java.util.List;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import com.shopjoy.ecadminapi.base.sy.data.dto.AttachFile;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pd_prod_qna", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 문의 엔티티
@Comment("상품문의")
public class PdProdQna extends BaseEntity {

    @Id
    @Comment("문의ID (YYMMDDhhmmss+rand4)")
    @Column(name = "prod_qna_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodQnaId 는 21자 이내여야 합니다.")
    private String prodQnaId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("SKUID (pd_prod_sku.prod_sku_id)")
    @Column(name = "prod_sku_id", length = 21)
    @Size(max = 21, message = "prodSkuId 는 21자 이내여야 합니다.")
    private String prodSkuId;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

    @Comment("문의유형코드 (코드: PROD_QNA_TYPE_CD)")
    @Column(name = "prod_qna_type_cd", length = 20)
    @Size(max = 20, message = "prodQnaTypeCd 는 20자 이내여야 합니다.")
    private String prodQnaTypeCd;

    @Comment("문의제목")
    @Column(name = "prod_qna_title", length = 200, nullable = false)
    @NotBlank(message = "Q&A 제목을 입력해주세요.")
    @Size(max = 200, message = "Q&A 제목은 200자 이내로 입력해주세요.")
    private String prodQnaTitle;

    @Comment("문의내용")
    @Column(name = "prod_qna_content", columnDefinition = "TEXT")
    @Size(max = 500000, message = "prodQnaContent 는 500,000자 이내여야 합니다.")
    private String prodQnaContent;

    @Comment("비밀글여부 Y/N")
    @Column(name = "scrt_yn", length = 1)
    @Size(max = 1, message = "scrtYn 는 1자 이내여야 합니다.")
    private String scrtYn;

    @Comment("답변여부 Y/N")
    @Column(name = "answ_yn", length = 1)
    @Size(max = 1, message = "answYn 는 1자 이내여야 합니다.")
    private String answYn;

    @Comment("답변내용")
    @Column(name = "answ_content", columnDefinition = "TEXT")
    @Size(max = 500000, message = "answContent 는 500,000자 이내여야 합니다.")
    private String answContent;

    @Comment("답변일시")
    @Column(name = "answ_date")
    private LocalDateTime answDate;

    @Comment("답변자ID (sy_user.user_id)")
    @Column(name = "answ_user_id", length = 21)
    @Size(max = 21, message = "answUserId 는 21자 이내여야 합니다.")
    private String answUserId;

    @Comment("노출여부 Y/N")
    @Column(name = "disp_yn", length = 1)
    @Size(max = 1, message = "dispYn 는 1자 이내여야 합니다.")
    private String dispYn;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    /** 질문 첨부파일 목록 — DB 컬럼 아님({@literal @}Transient). 요청 시엔 attachId/rowStatus(I/D) 만
     *  채워 보내고, create()/update() 가 prodQnaId 확정 직후 같은 트랜잭션에서
     *  sy_attach("pd_prod_qna")에 반영한 뒤, 같은 필드를 SyAttachService.getAttachFilesByRef()
     *  결과로 덮어써 응답에 되돌려준다. */
    @Transient
    private List<AttachFile> attachFiles;

    /** DB 컬럼 아님 — 답변 첨부파일 목록(2번째 슬롯 → attach2Files). 질문 첨부와 동일한 방식으로
     *  update() 가 sy_attach("pd_prod_qna_answer")에 반영 후 같은 필드를 덮어써 되돌려준다. */
    @Transient
    private List<AttachFile> attach2Files;

}
