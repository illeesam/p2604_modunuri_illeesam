package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyMenuDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID
        @Size(max = 21) private String menuId;  // 메뉴ID (YYMMDDhhmmss+rand4)
        @Size(max = 21) private String parentMenuId;  // 상위메뉴ID
        @Size(max = 50) private String menuCode;  // 메뉴코드
        @Size(max = 50) private String menuTypeCd;  // 메뉴유형 (코드: MENU_TYPE — PAGE/FOLDER/LINK)
        @Size(max = 1)  private String useYn;  // 사용여부 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_menu ──────────────────────────────────────────
        private String menuId;  // 메뉴ID (YYMMDDhhmmss+rand4)
        private String menuCode;  // 메뉴코드
        private String menuNm;  // 메뉴명
        private String parentMenuId;  // 상위메뉴ID
        private String menuUrl;  // 메뉴URL
        private String menuTypeCd;  // 메뉴유형 (코드: MENU_TYPE — PAGE/FOLDER/LINK)
        private String iconClass;  // 아이콘 CSS 클래스
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String menuRemark;  // 비고
        private String regBy;  // 등록자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자 (sy_user.user_id, ec_member.member_id)
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
        private String parentMenuNm;  // 상위메뉴명 (조인)
    }

}
