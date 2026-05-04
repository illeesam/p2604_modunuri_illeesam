package com.shopjoy.ecadminapi.co.auth.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * Spring Security @PreAuthorize SpEL에서 사용하는 인가 헬퍼 빈.
 *
 * 사용 예:
 *   @PreAuthorize("@authz.isBo(authentication)")
 *   @PreAuthorize("@authz.isFo(authentication)")
 *   @PreAuthorize("@authz.isBoOrFo(authentication)")
 *
 * 또는 커스텀 어노테이션:
 *   @BoOnly   → USER(관리자)만 허용
 *   @FoOnly   → MEMBER(고객)만 허용
 *   @BoOrFo   → USER 또는 MEMBER 허용
 */
@Component("authz")
public class Authz {

    public boolean isBo(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.BO.equals(p.appTypeCd());
        }
        return false;
    }

    public boolean isFo(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.FO.equals(p.appTypeCd());
        }
        return false;
    }

    public boolean isExt(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.EXT.equals(p.appTypeCd());
        }
        return false;
    }

    public boolean isSo(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.SO.equals(p.appTypeCd());
        }
        return false;
    }

    public boolean isBoOrFo(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.BO.equals(p.appTypeCd()) || AuthPrincipal.FO.equals(p.appTypeCd());
        }
        return false;
    }
}
