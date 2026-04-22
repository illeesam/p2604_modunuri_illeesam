package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 회원 정보 VO
 * - ec_member 테이블 기반
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreMemberInfo {
    private String memberId;
    private String memberEmail;
    private String memberNm;
    private String siteId;
    private String memberTypeCd;      // 회원 타입 (일반, VIP 등)
    private String memberHpNo;        // 휴대폰 번호
    private String memberGrade;       // 회원등급
    private String memberStaffYn;     // 직원 여부 (Y/N)
    private String memberBirthDt;     // 생년월일
    private String memberStatusCd;    // 상태 (ACTIVE, DORMANT, SUSPENDED)
    private Long cartCount;           // 장바구니 수량
    private Long likeCount;           // 찜한 상품 수
}
