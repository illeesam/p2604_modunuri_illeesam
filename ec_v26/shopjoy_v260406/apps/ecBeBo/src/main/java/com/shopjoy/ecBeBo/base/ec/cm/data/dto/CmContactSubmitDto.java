package com.shopjoy.ecBeBo.base.ec.cm.data.dto;

import com.shopjoy.ecBeBo.base.sy.data.dto.AttachFile;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * 문의 접수(고객센터) Request DTO.
 * 사용: POST /api/fo/ec/cm/contact
 */
public class CmContactSubmitDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        @Size(max = 21) private String siteId;  // 사이트ID
        /** 일반/주문/배송/교환환불 등 */
        @Size(max = 50) private String inquiryType;
        @Size(max = 100) private String name;  // 문의자명
        @Size(max = 200) private String email;  // 문의자 이메일
        @Size(max = 50) private String tel;  // 문의자 전화번호
        @Size(max = 50) private String orderNo;  // 관련 주문번호 (선택)
        /** 본문 */
        @Size(max = 4000) private String message;
        /** 작성자(로그인 회원 nm) */
        @Size(max = 100) private String blogAuthor;
        /** 문의 내용 첨부파일 목록 — 요청 시엔 attachId/rowStatus(I/D) 만 채워 보낸다.
         *  submit() 이 contactId 확정 직후 같은 트랜잭션에서 sy_attach 에 반영한다. */
        private List<AttachFile> attachFiles;
    }
}
