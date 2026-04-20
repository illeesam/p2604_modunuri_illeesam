package com.shopjoy.ecadminapi.auth.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * Spring Security @PreAuthorize SpEL에서 사용하는 인가 헬퍼 빈.
 *
 * 사용 예:
 *   @PreAuthorize("@authz.isUser(authentication)")
 *   @PreAuthorize("@authz.isMember(authentication)")
 *   @PreAuthorize("@authz.isUserOrMember(authentication)")
 *
 * 또는 커스텀 어노테이션:
 *   @UserOnly      → USER만 허용
 *   @MemberOnly    → MEMBER만 허용
 *   @UserOrMember  → USER 또는 MEMBER 허용
 */
@Component("authz")
public class Authz {

    public boolean isUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.USER.equals(p.userType());
        }
        return false;
    }

    public boolean isMember(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.MEMBER.equals(p.userType());
        }
        return false;
    }

    public boolean isUserOrMember(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return AuthPrincipal.USER.equals(p.userType()) || AuthPrincipal.MEMBER.equals(p.userType());
        }
        return false;
    }
}
