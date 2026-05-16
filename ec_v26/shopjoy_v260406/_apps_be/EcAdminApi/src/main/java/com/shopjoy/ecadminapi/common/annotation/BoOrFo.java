package com.shopjoy.ecadminapi.common.annotation;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

/**
 * BO(관리자) 또는 FO(회원) 접근을 모두 허용하는 인가 마커 어노테이션.
 *
 * <p>역할/책임: 메서드 단위 인가 어노테이션. {@link PreAuthorize} 메타-어노테이션으로
 * {@code @authz.isBoOrFo(authentication)} 가 평가되어, 인증 주체의 appTypeCd 가
 * BO(관리자) 또는 FO(회원) 중 하나면 호출을 허용한다.</p>
 *
 * <p>적용 위치: 관리자·회원이 공통으로 조회하는 GET 엔드포인트 메서드 또는 클래스.
 * 단, 양쪽 모두 인증은 필요하므로 비로그인은 거부된다(완전 공개는 /api/co/** permitAll 사용).</p>
 *
 * <p>인가 의미: BO ∪ FO 통과, EXT(외부)·비인증은 403 거부.</p>
 *
 * <p>주의: {@code @EnableMethodSecurity} 활성 및 SpEL 빈 {@code authz} 등록이 전제다.</p>
 *
 * <pre>
 *   &#64;GetMapping
 *   &#64;BoOrFo
 *   public ResponseEntity&lt;?&gt; list(...) { ... }
 * </pre>
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("@authz.isBoOrFo(authentication)")  // authz 빈이 appTypeCd ∈ {BO, FO} 판정
public @interface BoOrFo {
}
