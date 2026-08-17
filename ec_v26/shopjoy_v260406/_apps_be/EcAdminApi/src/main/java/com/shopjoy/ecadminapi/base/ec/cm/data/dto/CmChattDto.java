package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class CmChattDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String chattId;  // 채팅방ID 필터
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 20) private String chattStatusCd;  // 채팅방 상태 필터 — CHATT_STATUS {WAITING:대기, ACTIVE:진행중, DONE:완료}
        @Size(max = 21) private String refId;  // 참여자 참조ID 필터 (mb_member.member_id 또는 sy_user.user_id)
        @Size(max = 20) private String memberTypeCd;  // 참여자유형 필터 (MEMBER/ADMIN)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String chattId;  // 채팅방ID
        private String subject;  // 채팅주제
        private String chattStatusCd;  // 상태 — CHATT_STATUS {WAITING:대기, ACTIVE:진행중, DONE:완료}
        private String chattStatusCdBefore;  // 변경 전 상태 — CHATT_STATUS {WAITING:대기, ACTIVE:진행중, DONE:완료}
        private LocalDateTime lastMsgDate;  // 마지막 메시지 일시
        private String chattMemo;  // 관리자 메모
        private LocalDateTime closeDate;  // 종료일시
        private String closeReason;  // 종료사유
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private List<CmChattMemberDto.Item> members;  // 채팅방 참여자 목록
        private CmChattMsgDto.Item lastMsg;  // 마지막 메시지 정보
    }

}
