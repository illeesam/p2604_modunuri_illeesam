package com.shopjoy.ecadminapi.common.annotation;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

/**
 * EXT(외부 시스템, AppType = EXT) 전용 접근 인가 마커 어노테이션.
 *
 * <p>역할/책임: 메서드 단위 인가 어노테이션. {@link PreAuthorize} 메타-어노테이션으로
 * {@code @authz.isExt(authentication)} 가 평가되어, 인증 주체의 appTypeCd 가 EXT 인
 * 경우(외부 연동 토큰)에만 호출을 허용한다.</p>
 *
 * <p>적용 위치: 외부 시스템과의 연동 API 메서드 또는 클래스. URL 프리픽스 인가
 * (/api/ext/**)와 함께 개별 메서드 보호용으로 명시할 수 있다.</p>
 *
 * <p>인가 의미: 외부 시스템 토큰(appTypeCd=EXT)만 통과. BO·FO·비인증은 403 거부.</p>
 *
 * <p>주의: {@code @EnableMethodSecurity} 활성 및 SpEL 빈 {@code authz} 등록이 전제다.</p>
 *
 * <pre>
 *   &#64;GetMapping("/data")
 *   &#64;ExtOnly
 *   public ResponseEntity&lt;?&gt; getData(...) { ... }
 * </pre>
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("@authz.isExt(authentication)")  // authz 빈의 isExt() 가 appTypeCd=EXT 여부 판정
public @interface ExtOnly {
}
