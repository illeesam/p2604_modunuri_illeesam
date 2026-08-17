package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class MbMemberGroupDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;             // 사이트ID 필터
        @Size(max = 1) private String useYn;                // 사용여부 필터 Y/N
        @Size(max = 21) private String memberGroupId;       // 그룹ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String memberGroupId;               // 그룹ID (YYMMDDhhmmss+rand4)
        private String groupNm;                       // 그룹명
        private String groupMemo;                      // 메모
        private String useYn;                           // 사용여부 Y/N
        private String regBy;                            // 등록자
        private LocalDateTime regDate;                   // 등록일시
        private String regSiteId;                        // 등록 사이트ID
        private String updBy;                             // 수정자
        private LocalDateTime updDate;                    // 수정일시
    }

}
