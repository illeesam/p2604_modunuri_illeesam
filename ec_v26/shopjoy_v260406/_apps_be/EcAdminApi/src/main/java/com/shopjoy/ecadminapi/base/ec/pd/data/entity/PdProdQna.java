package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
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
    @Column(name = "qna_id", length = 21, nullable = false)
    private String qnaId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("SKUID (pd_prod_sku.sku_id)")
    @Column(name = "sku_id", length = 21)
    private String skuId;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21)
    private String orderId;

    @Comment("문의유형코드 (코드: PROD_QNA_TYPE)")
    @Column(name = "qna_type_cd", length = 20)
    private String qnaTypeCd;

    @Comment("문의제목")
    @Column(name = "qna_title", length = 200, nullable = false)
    private String qnaTitle;

    @Comment("문의내용")
    @Column(name = "qna_content", columnDefinition = "TEXT")
    private String qnaContent;

    @Comment("비밀글여부 Y/N")
    @Column(name = "scrt_yn", length = 1)
    private String scrtYn;

    @Comment("답변여부 Y/N")
    @Column(name = "answ_yn", length = 1)
    private String answYn;

    @Comment("답변내용")
    @Column(name = "answ_content", columnDefinition = "TEXT")
    private String answContent;

    @Comment("답변일시")
    @Column(name = "answ_date")
    private LocalDateTime answDate;

    @Comment("답변자ID (sy_user.user_id)")
    @Column(name = "answ_user_id", length = 21)
    private String answUserId;

    @Comment("노출여부 Y/N")
    @Column(name = "disp_yn", length = 1)
    private String dispYn;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
