package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class CmChattMsgDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String chattMsgId;  // 메시지ID 필터
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String chattId;  // 채팅방ID 필터 (cm_chatt.chatt_id)
        @Size(max = 21) private String senderId;  // 발신자ID 필터
        @Size(max = 20) private String senderTypeCd;  // 발신자유형 필터 (MEMBER/ADMIN/SYSTEM)
        @Size(max = 20) private String msgTypeCd;  // 메시지유형 필터 — CHATT_MESSAGE_TYPE {TEXT:텍스트, IMAGE:이미지, FILE:파일, SYSTEM:시스템}
        @Size(max = 21) private String afterMsgId;  // 이 메시지ID 이후만 조회(폴링용 커서)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String chattMsgId;  // 메시지ID
        private String chattId;  // 채팅방ID (cm_chatt.chatt_id)
        private String senderTypeCd;  // 발신자유형 (MEMBER/ADMIN/SYSTEM)
        private String senderId;  // 발신자ID (memberId 또는 userId)
        private String senderNm;  // 발신자명 (비정규화 캐시)
        private String msgText;  // 메시지 내용
        private String msgTypeCd;  // 메시지유형 — CHATT_MESSAGE_TYPE {TEXT:텍스트, IMAGE:이미지, FILE:파일, SYSTEM:시스템}
        private String refTypeCd;  // 참조유형 (ORDER/PRODUCT/CLAIM)
        private String refId;  // 참조ID
        private String readYn;  // 읽음여부 Y/N
        private LocalDateTime sendDate;  // 발송일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        /* 첨부는 공통 축약 DTO 를 쓴다 — sy_attach 컬럼명 그대로라 도메인마다 키가 갈리지 않는다.
           ref_table_nm='cm_chatt_msg' + ref_id=chattMsgId 기준으로 CmChattMsgService 가 일괄 주입한다(N+1 회피). */
        private List<SyAttachDto.Brief> attachFiles;  // 첨부파일 목록 (공통 축약 DTO)
    }

    @Getter @Setter @NoArgsConstructor
    public static class SendRequest {
        private String msgText;  // 전송할 메시지 내용
        private String msgTypeCd;  // 메시지유형 — CHATT_MESSAGE_TYPE {TEXT:텍스트, IMAGE:이미지, FILE:파일, SYSTEM:시스템}
        private String refTypeCd;  // 참조유형 (ORDER/PRODUCT/CLAIM)
        private String refId;  // 참조ID
        private String senderTypeCd;  // 발신자유형 (MEMBER/ADMIN/SYSTEM)
    }

}
