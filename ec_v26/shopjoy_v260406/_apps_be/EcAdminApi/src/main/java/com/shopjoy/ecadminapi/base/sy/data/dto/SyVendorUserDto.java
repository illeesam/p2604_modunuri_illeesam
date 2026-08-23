package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SyVendorUserDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String vendorId;  // 업체ID 검색값
        @Size(max = 21) private String vendorUserId;  // 업체사용자ID 검색값
        @Size(max = 21) private String userId;  // 사용자ID 검색값
        @Size(max = 20) private String status;  // 상태 검색값 — VENDOR_USER_STATUS_CD {ACTIVE:재직, LEFT:퇴직, SUSPENDED:정지}
        @Size(max = 1)  private String authYn;  // 업체 관리권한 여부 검색값 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_vendor_user ──────────────────────────────────────────
        private String vendorUserId;  // 판매/배송업체사용자ID (PK)
        private String vendorId;  // 판매/배송업체ID (sy_vendor.vendor_id)
        private String userId;  // 사용자ID (sy_user.user_id, NULL=비로그인)
        private String memberNm;  // 이름
        private String positionCd;  // 직위/직책 — POSITION_CD {CEO:대표, DIRECTOR:이사, MANAGER:팀장, EMPLOYEE:담당자}
        private String positionCdNm;  // 코드 라벨
        private String vendorUserDeptNm;  // 부서/팀명
        private String vendorUserPhone;  // 사무실 전화
        private String vendorUserMobile;  // 휴대전화
        private String vendorUserEmail;  // 이메일
        private LocalDate birthDate;  // 생년월일
        private String isMain;  // 대표 담당자 여부 (업체당 1명 권장)
        private String authYn;  // 업체 관리권한 여부 (Y=업체 정보 수정 가능)
        private LocalDate joinDate;  // 등록(합류) 일자
        private LocalDate leaveDate;  // 퇴직/탈퇴 일자
        private String vendorUserStatusCd;  // 상태 — VENDOR_USER_STATUS_CD {ACTIVE:재직, LEFT:퇴직, SUSPENDED:정지}
        private String vendorUserStatusCdNm;  // 코드 라벨
        private String vendorUserRemark;  // 비고
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
        private String vendorNm;  // 업체명 (JOIN)
    }

}
