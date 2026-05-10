package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.service.SyVendorUserRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 업체사용자권한 서비스 — base SyVendorUserRoleService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyVendorUserRoleService {

    private final SyVendorUserRoleService syVendorUserRoleService;

    public SyVendorUserRoleDto.Item getById(String id) { return syVendorUserRoleService.getById(id); }
    public List<SyVendorUserRoleDto.Item> getList(SyVendorUserRoleDto.Request req) { return syVendorUserRoleService.getList(req); }
    public SyVendorUserRoleDto.PageResponse getPageData(SyVendorUserRoleDto.Request req) { return syVendorUserRoleService.getPageData(req); }

    @Transactional public SyVendorUserRole create(SyVendorUserRole body) { return syVendorUserRoleService.create(body); }
    @Transactional public SyVendorUserRole update(String id, SyVendorUserRole body) { return syVendorUserRoleService.update(id, body); }
    @Transactional public void delete(String id) { syVendorUserRoleService.delete(id); }
    @Transactional public void saveList(List<SyVendorUserRole> rows) { syVendorUserRoleService.saveList(rows); }
}
