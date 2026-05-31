package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.service.SyRoleMenuService;
import com.shopjoy.ecadminapi.base.sy.service.SyRoleService;
import com.shopjoy.ecadminapi.base.sy.service.SyUserRoleService;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleMenuRedisStore;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleRedisStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * BO 역할 서비스 — base SyRoleService 위임 (thin wrapper) + 캐시 evict.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyRoleService {

    private final SyRoleService syRoleService;
    private final SyRoleMenuService syRoleMenuService;
    private final SyUserRoleService syUserRoleService;
    private final SyRoleRedisStore roleCache;
    private final SyRoleMenuRedisStore roleMenuCache;

    /* 키조회 */
    public SyRoleDto.Item getById(String id) { return syRoleService.getById(id); }
    /* 목록조회 */
    public List<SyRoleDto.Item> getList(SyRoleDto.Request req) { return syRoleService.getList(req); }
    /* 페이지조회 */
    public SyRoleDto.PageResponse getPageData(SyRoleDto.Request req) { return syRoleService.getPageData(req); }

    /* 등록 */
    @Transactional
    public SyRole create(SyRole body) {
        SyRole saved = syRoleService.create(body);
        roleCache.evictAll();
        return saved;
    }

    /* 수정 */
    @Transactional
    public SyRole update(String id, SyRole body) {
        SyRole saved = syRoleService.update(id, body);
        roleCache.evictAll();
        return saved;
    }

    /* 삭제 */
    @Transactional
    public void delete(String id) {
        syRoleService.delete(id);
        roleCache.evictAll();
        roleMenuCache.evict(id);
    }

    /* 목록저장 */
    @Transactional
    public void saveList(String cmd, List<SyRole> rows) {
        syRoleService.saveList(cmd, rows);
        roleCache.evictAll();
    }

    /* 역할별 메뉴 권한 조회 */
    public List<SyRoleMenuDto.Item> getMenusByRoleId(String roleId) {
        SyRoleMenuDto.Request req = new SyRoleMenuDto.Request();
        req.setRoleId(roleId);
        return syRoleMenuService.getList(req);
    }

    /* 역할별 대상 사용자 조회 */
    public List<SyUserRoleDto.Item> getUsersByRoleId(String roleId) {
        SyUserRoleDto.Request req = new SyUserRoleDto.Request();
        req.setRoleId(roleId);
        return syUserRoleService.getList(req);
    }

    /* 역할별 메뉴 권한 일괄 저장 — 기존 D + 신규 I 를 한 번에 saveList */
    @Transactional
    public void saveRoleMenus(String roleId, List<Map<String, Object>> menus) {
        /* 1) 검색조건: roleId 로 기존 매핑 조회 준비 */
        SyRoleMenuDto.Request req = new SyRoleMenuDto.Request();
        req.setRoleId(roleId);

        /* 2) 기존 매핑 → 모두 D(삭제) row 로 변환 */
        List<SyRoleMenu> rows = syRoleMenuService.getList(req).stream()
                .map(ex -> {
                    SyRoleMenu r = new SyRoleMenu();
                    r.setRoleMenuId(ex.getRoleMenuId());
                    r.setRowStatus("D");
                    return r;
                })
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

        /* 3) 신규 매핑 → I(등록) row 로 추가 */
        if (menus != null) for (Map<String, Object> m : menus) {
            Object menuId = m.get("menuId");
            if (menuId == null || String.valueOf(menuId).isBlank()) continue;  /* menuId 없으면 skip */
            SyRoleMenu r = new SyRoleMenu();
            r.setRoleId(roleId);
            r.setMenuId(String.valueOf(menuId));
            r.setRowStatus("I");
            /* permLevel 정수 변환 (실패하면 무시 — 기본값으로 INSERT) */
            Object perm = m.get("permLevel");
            if (perm != null) try { r.setPermLevel(Integer.valueOf(String.valueOf(perm))); } catch (NumberFormatException ignore) {}
            rows.add(r);
        }

        /* 4) D + I 한 번에 처리 (saveList 가 단계별 DELETE → INSERT 처리하여 unique 충돌 회피) */
        syRoleMenuService.saveList("base", rows);
        roleMenuCache.evict(roleId);  /* 캐시 무효화 */
    }

    /* 역할별 대상 사용자 일괄 저장 — 기존 D + 신규 I 를 한 번에 saveList */
    @Transactional
    public void saveRoleUsers(String roleId, List<Map<String, Object>> users) {
        /* 1) 검색조건: roleId 로 기존 매핑 조회 준비 */
        SyUserRoleDto.Request req = new SyUserRoleDto.Request();
        req.setRoleId(roleId);

        /* 2) 기존 매핑 → 모두 D(삭제) row 로 변환 */
        List<SyUserRole> rows = syUserRoleService.getList(req).stream()
                .map(ex -> {
                    SyUserRole r = new SyUserRole();
                    r.setUserRoleId(ex.getUserRoleId());
                    r.setRowStatus("D");
                    return r;
                })
                .collect(java.util.stream.Collectors.toCollection(java.util.ArrayList::new));

        /* 3) 신규 매핑 → I(등록) row 로 추가 (boUserId 우선, 없으면 userId) */
        if (users != null) for (Map<String, Object> u : users) {
            Object uid = u.getOrDefault("boUserId", u.get("userId"));
            if (uid == null || String.valueOf(uid).isBlank()) continue;  /* userId 없으면 skip */
            SyUserRole r = new SyUserRole();
            r.setRoleId(roleId);
            r.setUserId(String.valueOf(uid));
            r.setRowStatus("I");
            rows.add(r);
        }

        /* 4) D + I 한 번에 처리 (saveList 가 단계별 DELETE → INSERT 처리하여 unique(user_id, role_id) 충돌 회피) */
        syUserRoleService.saveList("base", rows);
    }
}
