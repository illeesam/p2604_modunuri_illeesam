package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import com.shopjoy.ecadminapi.common.util.Sensitive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class MbMemberDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;           // 사이트ID 필터
        @Size(max = 21) private String memberId;         // 회원ID 필터
        @Size(max = 20) private String gradeCd;          // 등급 드롭다운 — MEMBER_GRADE
        @Size(max = 20) private String memberStatusCd;   // 상태 드롭다운 — MEMBER_STATUS_CD
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String memberId;                     // 회원ID (YYMMDDhhmmss+rand4)
        private String loginId;                        // 이메일 (로그인 ID)
        private String memberNm;                        // 회원명
        @Sensitive("email") private String memberEmail;   // 회원 이메일 (수신용, 로그인ID와 별개)
        @Sensitive("phone") private String memberPhone;   // 연락처
        private String memberGender;                     // 성별 M/F
        private LocalDate birthDate;                     // 생년월일
        private String gradeCd;                          // 등급 — MEMBER_GRADE
        private String memberStatusCd;                   // 상태 — MEMBER_STATUS_CD
        private String memberStatusCdBefore;              // 변경 전 회원상태 — MEMBER_STATUS_CD
        private LocalDateTime joinDate;                   // 가입일
        private LocalDateTime lastLogin;                  // 최근 로그인
        private Integer orderCount;                       // 주문 건수
        private Long totalPurchaseAmt;                    // 누적 구매금액
        private Long cacheBalanceAmt;                     // 적립금 잔액
        private String memberZipCode;                     // 우편번호
        @Sensitive("address") private String memberAddr;         // 주소
        @Sensitive("address") private String memberAddrDetail;   // 상세주소
        private String memberMemo;                        // 메모
        private String regBy;                              // 등록자
        private LocalDateTime regDate;                     // 등록일시
        private String regSiteId;                          // 등록 사이트ID
        private String updBy;                               // 수정자
        private LocalDateTime updDate;                      // 수정일시
        private String siteNm;                               // 사이트명 (조인)
        private String gradeCdNm;                            // 등급명 (조인)
        private String memberStatusCdNm;                     // 회원상태명 (조인)
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<MbMemberAddrDto.Item> addrs;     // 배송지 목록
        private List<MbMemberSnsDto.Item>  snsList;   // SNS 연동 목록
    }

}
