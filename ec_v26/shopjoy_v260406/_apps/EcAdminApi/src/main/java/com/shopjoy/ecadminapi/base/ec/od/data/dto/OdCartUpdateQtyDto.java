package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 장바구니 수량 변경 Request DTO.
 * 사용: PATCH /api/fo/ec/od/cart/{cartId}
 */
public class OdCartUpdateQtyDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        private Integer qty;
    }
}
