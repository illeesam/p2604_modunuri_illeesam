package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class CmChattMemberDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String chattMemberId;  // 참여자ID 필터
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String chattId;  // 채팅방ID 필터 (cm_chatt.chatt_id)
        @Size(max = 20) private String memberTypeCd;  // 참여자유형 필터 (MEMBER/ADMIN)
        @Size(max = 21) private String refId;  // 참조ID 필터 (mb_member.member_id 또는 sy_user.user_id)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String chattMemberId;  // 참여자ID
        private String chattId;  // 채팅방ID (cm_chatt.chatt_id)
        private String memberTypeCd;  // 참여자유형 (MEMBER/ADMIN)
        private String refId;  // 참조ID (mb_member.member_id 또는 sy_user.user_id)
        private String refNm;  // 참여자명 (비정규화 캐시)
        private Integer unreadCnt;  // 미읽음 메시지 수
        private LocalDateTime joinDate;  // 참여일시
        private LocalDateTime leaveDate;  // 퇴장일시 (NULL=현재 참여중)
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
