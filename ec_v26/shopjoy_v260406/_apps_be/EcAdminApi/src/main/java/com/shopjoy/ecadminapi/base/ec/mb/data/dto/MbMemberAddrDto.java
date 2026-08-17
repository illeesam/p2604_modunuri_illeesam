package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import com.shopjoy.ecadminapi.common.util.Sensitive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class MbMemberAddrDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String memberAddrId;       // 배송지ID 필터
        @Size(max = 21) private String memberId;           // 회원ID 필터
        private List<String> memberIds;                // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String memberAddrId;                // 배송지ID (YYMMDDhhmmss+rand4)
        private String memberId;                     // 회원ID (mb_member.member_id)
        private String addrNm;                        // 배송지명 (예: 집, 회사)
        private String recvNm;                         // 수령자명
        @Sensitive("phone")   private String recvPhone;   // 수령자 연락처
        private String zipCode;                        // 우편번호
        @Sensitive("address") private String addr;         // 기본주소
        @Sensitive("address") private String addrDetail;   // 상세주소
        private String defaultYn;                       // 기본배송지여부 Y/N
        private String regBy;                            // 등록자
        private LocalDateTime regDate;                   // 등록일시
        private String regSiteId;                        // 등록 사이트ID
        private String updBy;                             // 수정자
        private LocalDateTime updDate;                    // 수정일시
    }

}
