package com.shopjoy.ecBeBo.base.ec.mb.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class MbMemberSnsDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String memberSnsId;    // SNS연동ID 필터
        @Size(max = 21) private String memberId;       // 상위 FK 필터
        private List<String> memberIds;                // 상위 FK 다건 IN
        @Size(max = 30) private String snsChannelCd;   // SNS채널코드 필터 — SNS_CHANNEL_CD
        @Size(max = 100) private String snsUserId;     // SNS 플랫폼 사용자ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String memberSnsId;         // SNS연동ID (YYMMDDhhmmss+rand4)
        private String memberId;             // 회원ID (mb_member.member_id)
        private String snsChannelCd;          // SNS채널코드 — SNS_CHANNEL_CD
        private String snsChannelCdNm;         // SNS채널 코드 라벨
        private String snsUserId;              // SNS 플랫폼 사용자ID
        private String regBy;                   // 등록자
        private LocalDateTime regDate;          // 등록일시
        private String regSiteId;               // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}
