package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pd_prod_qna", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 문의 엔티티
public class PdProdQna extends BaseEntity {

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

    @Column(name = "qna_content", columnDefinition = "TEXT")
    private String qnaContent;

    @Column(name = "scrt_yn", length = 1)
    private String scrtYn;

    @Column(name = "answ_yn", length = 1)
    private String answYn;

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

}
