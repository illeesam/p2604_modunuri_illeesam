package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_prod_qna", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 문의 엔티티
public class PdProdQna {

    @Id
    @Column(name = "qna_id", length = 21, nullable = false)
    private String qnaId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "sku_id", length = 21)
    private String skuId;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "order_id", length = 21)
    private String orderId;

    @Column(name = "qna_type_cd", length = 20)
    private String qnaTypeCd;

    @Column(name = "qna_title", length = 200, nullable = false)
    private String qnaTitle;

    @Lob
    @Column(name = "qna_content", columnDefinition = "TEXT")
    private String qnaContent;

    @Column(name = "scrt_yn", length = 1)
    private String scrtYn;

    @Column(name = "answ_yn", length = 1)
    private String answYn;

    @Lob
    @Column(name = "answ_content", columnDefinition = "TEXT")
    private String answContent;

    @Column(name = "answ_date")
    private LocalDateTime answDate;

    @Column(name = "answ_user_id", length = 21)
    private String answUserId;

    @Column(name = "disp_yn", length = 1)
    private String dispYn;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}