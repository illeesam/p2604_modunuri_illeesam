package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdHistDto {

    // ── 공통 ──────────────────────────────────────────────────────
    private String histId;
    private String prodId;
    private LocalDateTime histDate;
    private String regBy;
    private String regByNm;

    // ── 재고 이력 (pd_prod_stock_hist) ───────────────────────────
    private String stockTypeCd;
    private String stockTypeCdNm;
    private Integer stockQty;
    private Integer stockBalance;
    private String stockMemo;

    // ── 가격 이력 (pd_prod_price_hist) ──────────────────────────
    private String priceField;
    private String priceBefore;
    private String priceAfter;

    // ── 상태 이력 (pd_prod_status_hist) ─────────────────────────
    private String statusCdBefore;
    private String statusCdBeforeNm;
    private String statusCdAfter;
    private String statusCdAfterNm;

    // ── 변경 이력 (pd_prod_change_hist) ─────────────────────────
    private String changeField;
    private String changeBefore;
    private String changeAfter;

    // ── 연관 주문 (od_order JOIN pd_order_item) ──────────────────
    private String orderId;
    private String memberId;
    private String memberNm;
    private LocalDateTime orderDate;
    private Long totalAmt;
    private String orderStatusCd;
    private String orderStatusCdNm;
    private Integer orderQty;
}
