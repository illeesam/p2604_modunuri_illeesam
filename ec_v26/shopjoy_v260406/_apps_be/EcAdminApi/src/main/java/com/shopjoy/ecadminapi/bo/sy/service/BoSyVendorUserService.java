package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.base.sy.service.SyVendorUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 업체사용자 서비스 — base SyVendorUserService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyVendorUserService {

    private final SyVendorUserService syVendorUserService;

    /* 키조회 */
    public SyVendorUserDto.Item getById(String id) { return syVendorUserService.getById(id); }
    /* 목록조회 */
    public List<SyVendorUserDto.Item> getList(SyVendorUserDto.Request req) { return syVendorUserService.getList(req); }
    /* 페이지조회 */
    public SyVendorUserDto.PageResponse getPageData(SyVendorUserDto.Request req) { return syVendorUserService.getPageData(req); }

    @Transactional public SyVendorUser create(SyVendorUser body) { return syVendorUserService.create(body); }
    @Transactional public SyVendorUser update(String id, SyVendorUser body) { return syVendorUserService.update(id, body); }
    @Transactional public void delete(String id) { syVendorUserService.delete(id); }
    @Transactional public void saveList(List<SyVendorUser> rows) { syVendorUserService.saveList(rows); }
}
