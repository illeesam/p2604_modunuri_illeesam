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

    /** isBo — 여부 */
    public boolean isBo(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.BO.equals(p.appTypeCd());
        }
        return false;
    }

    /** isFo — 여부 */
    public boolean isFo(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.FO.equals(p.appTypeCd());
        }
        return false;
    }

    /** isExt — 여부 */
    public boolean isExt(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.EXT.equals(p.appTypeCd());
        }
        return false;
    }

    /** isSo — 여부 */
    public boolean isSo(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.SO.equals(p.appTypeCd());
        }
        return false;
    }

    /** isBoOrFo — 여부 */
    public boolean isBoOrFo(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.BO.equals(p.appTypeCd()) || AuthPrincipal.FO.equals(p.appTypeCd());
        }
        return false;
    }
}
