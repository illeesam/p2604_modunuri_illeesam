package com.shopjoy.ecadminapi.common.util;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Dto.Item 필드에 붙여 "민감정보(연락처/주소/계좌 등)"임을 표시한다.
 *
 * <p>{@link SecurityUtil#hasSensitiveViewAuth()} 가 false 인 요청에 한해 값이 {@link MaskUtil}
 * 로 마스킹된다 — 화면 그리드(JSON 응답)와 엑셀 다운로드 양쪽 모두 이 마커 하나로 커버된다.
 *
 * <p><b>붙이는 위치는 반드시 Dto.Item</b>(Entity 아님)이다 — 화면 응답과 엑셀 export 가 공통으로
 * 읽는 클래스가 Dto.Item 이기 때문이다(엑셀은 {@code handler.itemClass()} 필드를 reflection 으로
 * 읽는다). Entity 에 붙이면 아무 경로도 이를 참조하지 않는다.
 *
 * <p>사용 예:
 * <pre>
 * public static class Item {
 *     &#064;Sensitive("phone")   private String memberPhone;
 *     &#064;Sensitive("email")   private String memberEmail;
 *     &#064;Sensitive("address") private String memberAddr;
 * }
 * </pre>
 *
 * @see MaskUtil#MASK_TYPES 지원하는 value 목록(phone/email/name/account/address)
 */
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
public @interface Sensitive {
    /** 마스킹 타입 — {@link MaskUtil#mask(String, String)} 참조 */
    String value();
}
