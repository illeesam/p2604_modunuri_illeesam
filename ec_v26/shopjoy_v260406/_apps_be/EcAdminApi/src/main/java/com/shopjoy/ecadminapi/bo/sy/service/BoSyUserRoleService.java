package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import com.shopjoy.ecadminapi.base.sy.service.SyUserRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 사용자권한 서비스 — base SyUserRoleService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyUserRoleService {

    private final SyUserRoleService syUserRoleService;

    /* 키조회 */
    public SyUserRoleDto.Item getById(String id) { return syUserRoleService.getById(id); }
    /* 목록조회 */
    public List<SyUserRoleDto.Item> getList(SyUserRoleDto.Request req) { return syUserRoleService.getList(req); }
    /* 페이지조회 */
    public SyUserRoleDto.PageResponse getPageData(SyUserRoleDto.Request req) { return syUserRoleService.getPageData(req); }
    /* getRolesByUserId */
    public List<SyUserRoleDto.Item> getRolesByUserId(String userId) { return syUserRoleService.getRolesByUserId(userId); }

    @Transactional public SyUserRole create(SyUserRole body) { return syUserRoleService.create(body); }
    @Transactional public SyUserRole update(String id, SyUserRole body) { return syUserRoleService.update(id, body); }
    @Transactional public void delete(String id) { syUserRoleService.delete(id); }
    @Transactional public void saveList(List<SyUserRole> rows) { syUserRoleService.saveList(rows); }
}
