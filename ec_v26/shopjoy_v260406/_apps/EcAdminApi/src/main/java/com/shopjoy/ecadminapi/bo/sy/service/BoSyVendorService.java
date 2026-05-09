package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.service.SyVendorService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 거래처 서비스 — base SyVendorService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyVendorService {

    private final SyVendorService syVendorService;

    public SyVendorDto.Item getById(String id) { return syVendorService.getById(id); }
    public List<SyVendorDto.Item> getList(SyVendorDto.Request req) { return syVendorService.getList(req); }
    public SyVendorDto.PageResponse getPageData(SyVendorDto.Request req) { return syVendorService.getPageData(req); }

    @Transactional public SyVendor create(SyVendor body) { return syVendorService.create(body); }
    @Transactional public SyVendor update(String id, SyVendor body) { return syVendorService.update(id, body); }
    @Transactional public void delete(String id) { syVendorService.delete(id); }
    @Transactional public List<SyVendor> saveList(List<SyVendor> rows) { return syVendorService.saveList(rows); }
}
