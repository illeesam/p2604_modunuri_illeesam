package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 문의 접수(고객센터) Request DTO.
 * 사용: POST /api/fo/ec/cm/contact
 */
public class CmContactSubmitDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 21) private String siteId;
        /** 일반/주문/배송/교환환불 등 */
        @Size(max = 50) private String inquiryType;
        @Size(max = 100) private String name;
        @Size(max = 200) private String email;
        @Size(max = 50) private String tel;
        @Size(max = 50) private String orderNo;
        /** 본문 */
        @Size(max = 4000) private String message;
        /** 작성자(로그인 회원 nm) */
        @Size(max = 100) private String blogAuthor;
    }
}
