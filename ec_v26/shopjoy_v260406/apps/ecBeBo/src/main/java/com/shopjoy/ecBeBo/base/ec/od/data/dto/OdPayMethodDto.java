package com.shopjoy.ecBeBo.base.ec.od.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdPayMethodDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String payMethodId;  // 결제수단ID (YYMMDDhhmmss+rand4)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String payMethodId;  // 결제수단ID (YYMMDDhhmmss+rand4)
        private String memberId;  // 회원ID (mb_member.member_id)
        private String payMethodTypeCd;  // 결제수단유형코드 (코드: PAY_METHOD)
        private String payMethodTypeCdNm;  // 코드 라벨
        private String payMethodNm;  // 결제수단명 (카드사명, 은행명 등)
        private String payMethodAlias;  // 별칭 (사용자 설정)
        private String payKeyNo;  // 결제 게이트웨이 발급 키/토큰
        private String mainMethodYn;  // 기본결제수단여부 Y/N
        private String regBy;  // 등록자ID
        private LocalDateTime regDate;  // 등록일시
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자ID
        private LocalDateTime updDate;  // 수정일시
    }

}
