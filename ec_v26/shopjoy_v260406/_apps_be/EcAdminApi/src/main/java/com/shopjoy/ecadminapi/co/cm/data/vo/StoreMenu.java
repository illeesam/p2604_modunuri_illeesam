package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 메뉴 정보 VO
 * - sy_menu 테이블 기반
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StoreMenu {
    private String menuId;            // 메뉴 ID
    private String menuNm;            // 메뉴명
    private String menuPath;          // 메뉴 경로
    private String parentMenuId;      // 상위 메뉴 ID
    private Integer menuLevel;        // 메뉴 레벨
    private String menuSortOrd;       // 정렬 순서
    private String menuIconCd;        // 메뉴 아이콘 코드
    private String menuStatusCd;      // 메뉴 상태 (ACTIVE, INACTIVE)
    private String menuRemark;        // 비고
    private String regDate;           // 등록 일시
    private String modDate;           // 수정 일시
}
