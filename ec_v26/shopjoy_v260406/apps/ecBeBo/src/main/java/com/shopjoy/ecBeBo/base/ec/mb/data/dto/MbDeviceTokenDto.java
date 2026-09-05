package com.shopjoy.ecBeBo.base.ec.mb.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MbDeviceTokenDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;          // 사이트ID 필터
        @Size(max = 21) private String deviceTokenId;   // 디바이스토큰ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String deviceTokenId;             // 디바이스토큰ID (YYMMDDhhmmss+rand4)
        private String deviceToken;                // 디바이스 토큰 키
        private String memberId;                   // 회원ID (mb_member.member_id)
        private String osTypeCd;                    // OS유형 ANDROID/IOS
        private String benefitNotiYn;               // 혜택알림수신여부 Y/N
        private LocalDateTime alimReadDate;          // 알림리스트 읽음일시
        private String regBy;                       // 등록자
        private LocalDateTime regDate;               // 등록일시
        private String regSiteId;                    // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                        // 수정자
        private LocalDateTime updDate;                // 수정일시
        private String memberNm;                     // 회원명 (조인)
    }

}
