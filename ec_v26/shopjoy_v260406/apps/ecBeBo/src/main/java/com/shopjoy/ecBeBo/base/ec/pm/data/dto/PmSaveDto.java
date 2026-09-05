package com.shopjoy.ecBeBo.base.ec.pm.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
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
        @Size(max = 21)  private String prodId;    // 대상상품 ID 필터 (EXISTS eq via pm_save_prod)
        @Size(max = 200) private String prodNm;    // 대상상품명 필터 (EXISTS LIKE via pm_save_prod→pd_prod)
        @Size(max = 21)  private String vendorId;  // 업체 ID 필터 (EXISTS eq via pm_save_prod→pd_prod)
        @Size(max = 200) private String vendorNm;  // 업체명 필터 (EXISTS LIKE via pm_save_prod→pd_prod→sy_vendor)
        @Size(max = 21)  private String mdUserId;  // 담당MD ID 필터 (EXISTS eq via pm_save_prod→pd_prod)
        @Size(max = 200) private String mdUserNm;  // 담당MD명 필터 (EXISTS LIKE via pm_save_prod→pd_prod→sy_user)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String saveId;
        private String memberId;
        private String saveTypeCd;
        private String saveTypeCdNm;  // 코드 라벨
        private Long saveAmt;
        private Long balanceAmt;
        private String refTypeCd;
        private String refId;
        private LocalDateTime expireDate;
        private String saveMemo;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}
