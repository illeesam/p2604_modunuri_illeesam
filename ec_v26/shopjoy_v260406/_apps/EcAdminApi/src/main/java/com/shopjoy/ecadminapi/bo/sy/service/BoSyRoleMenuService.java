package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRoleMenu;
import com.shopjoy.ecadminapi.base.sy.service.SyRoleMenuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 역할-메뉴 서비스 — base SyRoleMenuService 위임 (thin wrapper).
 * 캐시 evict 는 base service 에 이미 포함됨.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyRoleMenuService {

    private final SyRoleMenuService syRoleMenuService;

    public SyRoleMenuDto.Item getById(String id) { return syRoleMenuService.getById(id); }
    public List<SyRoleMenuDto.Item> getList(SyRoleMenuDto.Request req) { return syRoleMenuService.getList(req); }
    public SyRoleMenuDto.PageResponse getPageData(SyRoleMenuDto.Request req) { return syRoleMenuService.getPageData(req); }

    @Transactional public SyRoleMenu create(SyRoleMenu body) { return syRoleMenuService.create(body); }
    @Transactional public SyRoleMenu update(String id, SyRoleMenu body) { return syRoleMenuService.update(id, body); }
    @Transactional public void delete(String id) { syRoleMenuService.delete(id); }
    @Transactional public List<SyRoleMenu> saveList(List<SyRoleMenu> rows) { return syRoleMenuService.saveList(rows); }
}
