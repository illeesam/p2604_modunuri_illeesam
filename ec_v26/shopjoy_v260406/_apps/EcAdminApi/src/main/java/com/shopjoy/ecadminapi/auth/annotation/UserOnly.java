package com.shopjoy.ecadminapi.auth.annotation;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

/**
 * userType = USER(관리자)만 접근 허용.
 * POST / PUT / PATCH / DELETE 메서드 또는 클래스에 사용.
 *
 * 사용 예:
 *   @PostMapping
 *   @UserOnly
 *   public ResponseEntity<?> create(...) { ... }
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("@authz.isUser(authentication)")
public @interface UserOnly {
}
