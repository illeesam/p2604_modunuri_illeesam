package com.shopjoy.ecadminapi.co.auth.annotation;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

/**
 * userType = EXT(외부 시스템)만 접근 허용.
 * 외부 연동 API 메서드/클래스에 사용.
 *
 * 사용 예:
 *   @GetMapping("/data")
 *   @ExtOnly
 *   public ResponseEntity<?> getData(...) { ... }
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("@authz.isExt(authentication)")
public @interface ExtOnly {
}
