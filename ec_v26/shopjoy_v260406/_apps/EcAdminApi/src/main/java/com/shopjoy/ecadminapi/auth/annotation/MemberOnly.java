package com.shopjoy.ecadminapi.auth.annotation;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

/**
 * userType = MEMBER(고객)만 접근 허용.
 * FO 마이페이지 등 로그인 회원 전용 메서드/클래스에 사용.
 *
 * 사용 예:
 *   @GetMapping("/info")
 *   @MemberOnly
 *   public ResponseEntity<?> getMyInfo(...) { ... }
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("@authz.isMember(authentication)")
public @interface MemberOnly {
}
