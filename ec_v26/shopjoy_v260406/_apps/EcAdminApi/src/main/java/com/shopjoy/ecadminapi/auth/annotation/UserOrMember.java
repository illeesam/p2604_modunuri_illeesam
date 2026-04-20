package com.shopjoy.ecadminapi.auth.annotation;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

/**
 * userType = USER(관리자) 또는 MEMBER(고객) 접근 허용.
 * GET 메서드 또는 클래스에 사용.
 *
 * 사용 예:
 *   @GetMapping
 *   @UserOrMember
 *   public ResponseEntity<?> list(...) { ... }
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("@authz.isUserOrMember(authentication)")
public @interface UserOrMember {
}
