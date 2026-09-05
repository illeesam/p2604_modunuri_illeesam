package com.shopjoy.ecadminapi.common.annotation;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

/**
 * BO(관리자, AppType = USER) 전용 접근 인가 마커 어노테이션.
 *
 * <p>역할/책임: Spring Security 의 메서드 단위 인가 어노테이션. 부착된 메서드/클래스에
 * {@link PreAuthorize} 메타-어노테이션을 통해 {@code @authz.isBo(authentication)} SpEL 표현식이
 * 평가되어, 인증 주체의 appTypeCd 가 BO(관리자) 인 경우에만 호출을 허용한다.</p>
 *
 * <p>적용 위치: Controller 의 변경성 엔드포인트(POST / PUT / PATCH / DELETE) 메서드 또는
 * 클래스 타입. {@code @EnableMethodSecurity}(SecurityConfig) 활성화가 전제다.</p>
 *
 * <p>인가 의미: 관리자 토큰(appTypeCd=BO)만 통과. 회원(FO)·외부(EXT)·비인증은 403 거부.
 * URL 프리픽스 인가(/api/bo/**)와 중복되더라도 개별 메서드 보호용으로 명시할 수 있다.</p>
 *
 * <p>주의: 인터페이스가 아닌 구현 클래스/메서드에 부착해야 프록시 인가가 적용된다.
 * SpEL 빈 {@code authz} 가 미등록이면 기동/호출 시 빈 해석 오류가 발생한다.</p>
 *
 * <pre>
 *   &#64;PostMapping
 *   &#64;BoOnly
 *   public ResponseEntity&lt;?&gt; create(...) { ... }
 * </pre>
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("@authz.isBo(authentication)")  // authz 빈의 isBo() 가 appTypeCd=BO 여부 판정
public @interface BoOnly {
}
