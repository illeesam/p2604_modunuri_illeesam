package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class MbMemberSnsDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String memberSnsId;    // SNS연동ID 필터
        @Size(max = 21) private String memberId;       // 상위 FK 필터
        private List<String> memberIds;                // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String memberSnsId;         // SNS연동ID (YYMMDDhhmmss+rand4)
        private String memberId;             // 회원ID (mb_member.member_id)
        private String snsChannelCd;          // SNS채널코드 — SNS_CHANNEL_CD
        private String snsUserId;              // SNS 플랫폼 사용자ID
        private String regBy;                   // 등록자
        private LocalDateTime regDate;          // 등록일시
        private String regSiteId;               // 등록 사이트ID
    }

}
