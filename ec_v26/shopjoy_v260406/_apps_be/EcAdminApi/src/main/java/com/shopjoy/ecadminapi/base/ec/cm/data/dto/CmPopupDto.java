package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPopup;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 팝업 정의(cm_popup) 조회 DTO — 팝업관리 화면의 목록/페이징.
 *
 * <p>Item 을 따로 두지 않고 {@link CmPopup} 엔티티를 그대로 항목 타입으로 쓴다.
 * 팝업관리 화면은 정의 <b>전 필드</b>를 그대로 편집하므로 Item 을 만들면 엔티티와 1:1
 * 복사본이 되고, 필드가 늘 때마다 두 곳을 고쳐야 한다(빠뜨리면 화면에서 값이 조용히 사라진다).
 * 조회 결과를 좁힐 이유가 없는 화면이라 중복을 만들지 않는 쪽을 택했다.</p>
 */
public class CmPopupDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 1)  private String useYn;  // 사용여부 Y/N 필터
        private Integer popupPattern;  // 화면패턴 필터 1:목록 / 2:트리+목록 / 3:트리+목록+선택목록
    }

    /** 항목 타입은 엔티티 — 위 클래스 주석 참조 */
}
