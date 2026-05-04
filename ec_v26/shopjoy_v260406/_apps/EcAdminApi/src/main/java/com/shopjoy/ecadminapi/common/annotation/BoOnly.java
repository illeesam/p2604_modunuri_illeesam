package com.shopjoy.ecadminapi.common.annotation;

import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.annotation.*;

/**
 * AppType = USER(관리자)만 접근 허용.
 * POST / PUT / PATCH / DELETE 메서드 또는 클래스에 사용.
 *
 * 사용 예:
 *   @PostMapping
 *   @BoOnly
 *   public ResponseEntity<?> create(...) { ... }
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@PreAuthorize("@authz.isBo(authentication)")
public @interface BoOnly {
}
