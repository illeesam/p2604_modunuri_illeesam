package com.shopjoy.ecBeBo.base.ec.od.data.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
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
        @NotNull(message = "수량을 입력해주세요.")
        @Min(value = 1, message = "수량은 1개 이상이어야 합니다.")
        private Integer qty;  // 변경할 장바구니 수량
    }
}
