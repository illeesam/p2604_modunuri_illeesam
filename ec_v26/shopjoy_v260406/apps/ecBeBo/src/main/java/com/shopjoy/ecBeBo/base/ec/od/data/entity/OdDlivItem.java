package com.shopjoy.ecBeBo.base.ec.od.data.entity;

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
@Table(name = "od_dliv_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 배송 아이템 엔티티
@Comment("배송 항목 (배송에 포함된 주문상품 명세)")
public class OdDlivItem extends BaseEntity {

    @Id
    @Comment("배송항목ID (YYMMDDhhmmss+rand4)")
    @Column(name = "dliv_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "dlivItemId 는 21자 이내여야 합니다.")
    private String dlivItemId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("배송ID (od_dliv.)")
    @Column(name = "dliv_id", length = 21, nullable = false)
    @Size(max = 21, message = "dlivId 는 21자 이내여야 합니다.")
    private String dlivId;

    @Comment("주문상품ID (od_order_item.)")
    @Column(name = "order_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "orderItemId 는 21자 이내여야 합니다.")
    private String orderItemId;

    @Comment("상품ID")
    @Column(name = "prod_id", length = 21)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("옵션1 값ID (pd_prod_opt.opt_id)")
    @Column(name = "prod_opt1_id", length = 21)
    @Size(max = 21, message = "prodOpt1Id 는 21자 이내여야 합니다.")
    private String prodOpt1Id;

    @Comment("옵션2 값ID (pd_prod_opt.opt_id)")
    @Column(name = "prod_opt2_id", length = 21)
    @Size(max = 21, message = "prodOpt2Id 는 21자 이내여야 합니다.")
    private String prodOpt2Id;

    @Comment("입출고구분 (OUT:출고 / IN:입고반품)")
    @Column(name = "dliv_type_cd", length = 20)
    @Size(max = 20, message = "dlivTypeCd 는 20자 이내여야 합니다.")
    private String dlivTypeCd;

    @Comment("단가 (주문시점 스냅샷)")
    @Column(name = "unit_price")
    private Long unitPrice;

    @Comment("출고수량 (부분출고 시 주문수량보다 적을 수 있음)")
    @Column(name = "dliv_qty")
    private Integer dlivQty;

    @Comment("항목 배송상태 (코드: DLIV_STATUS)")
    @Column(name = "dliv_item_status_cd", length = 20)
    @Size(max = 20, message = "dlivItemStatusCd 는 20자 이내여야 합니다.")
    private String dlivItemStatusCd;

    @Comment("변경 전 배송상태 (코드: DLIV_STATUS)")
    @Column(name = "dliv_item_status_cd_before", length = 20)
    @Size(max = 20, message = "dlivItemStatusCdBefore 는 20자 이내여야 합니다.")
    private String dlivItemStatusCdBefore;

}
