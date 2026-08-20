package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class CmhPushLogDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String logId;  // 로그ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String logId;  // 로그ID (YYMMDDhhmmss+rand4)
        private String channelCd;  // 발송채널 — MSG_CHANNEL {EMAIL:이메일, SMS:SMS, KAKAO:알림톡, PUSH:푸시}
        private String templateId;  // 템플릿ID (sy_template.template_id)
        private String memberId;  // 대상 회원ID
        private String recvAddr;  // 수신처 (이메일/전화번호/디바이스토큰)
        private String pushLogTitle;  // 발송 제목
        private String pushLogContent;  // 발송 내용
        private String resultCd;  // 발송결과 — SEND_RESULT {SUCCESS:성공, FAILED:실패, PENDING:대기, FAIL:실패}
        private String failReason;  // 실패 사유
        private LocalDateTime sendDate;  // 발송일시
        private String refTypeCd;  // 연관유형코드 (ORDER/CLAIM/EVENT 등)
        private String refId;  // 연관ID
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
