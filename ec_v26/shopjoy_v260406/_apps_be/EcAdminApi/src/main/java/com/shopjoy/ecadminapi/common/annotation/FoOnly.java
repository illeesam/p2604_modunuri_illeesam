package com.shopjoy.ecadminapi.common.annotation;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

/**
 * FO(회원, AppType = MEMBER) 전용 접근 인가 마커 어노테이션.
 *
 * <p>역할/책임: 메서드 단위 인가 어노테이션. {@link PreAuthorize} 메타-어노테이션으로
 * {@code @authz.isFo(authentication)} 가 평가되어, 인증 주체의 appTypeCd 가 FO(회원)
 * 인 경우에만 호출을 허용한다.</p>
 *
 * <p>적용 위치: FO 마이페이지·주문·찜 등 로그인 회원 전용 메서드 또는 클래스.
 * URL 프리픽스 인가(/api/fo/my/** 등)와 함께 개별 메서드 보호용으로 명시할 수 있다.</p>
 *
 * <p>인가 의미: 회원 토큰(appTypeCd=FO)만 통과. 관리자(BO)·외부(EXT)·비인증은 403 거부.</p>
 *
 * <p>주의: {@code @EnableMethodSecurity} 활성 및 SpEL 빈 {@code authz} 등록이 전제다.</p>
 *
 * <pre>
 *   &#64;GetMapping("/info")
 *   &#64;FoOnly
 *   public ResponseEntity&lt;?&gt; getMyInfo(...) { ... }
 * </pre>
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("@authz.isFo(authentication)")  // authz 빈의 isFo() 가 appTypeCd=FO 여부 판정
public @interface FoOnly {
}
