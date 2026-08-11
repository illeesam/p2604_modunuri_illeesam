package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PmSaveDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String saveId;
        private List<String> saveIds;              // PK 다건 IN
        @Size(max = 20) private String saveTypeCd;
        /* 회원별 적립 조회 — 화면(PmSaveMng)에 검색란이 있었으나 필드가 없어 무시되던 것을 추가 */
        @Size(max = 21) private String memberId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String saveId;
        private String memberId;
        private String saveTypeCd;
        private Long saveAmt;
        private Long balanceAmt;
        private String refTypeCd;
        private String refId;
        private LocalDateTime expireDate;
        private String saveMemo;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
    }

}
