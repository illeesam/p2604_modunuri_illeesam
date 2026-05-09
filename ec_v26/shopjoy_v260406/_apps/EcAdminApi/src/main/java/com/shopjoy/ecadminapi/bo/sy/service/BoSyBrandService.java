package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBrand;
import com.shopjoy.ecadminapi.base.sy.service.SyBrandService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 브랜드 서비스 — base SyBrandService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyBrandService {

    private final SyBrandService syBrandService;

    public SyBrandDto.Item getById(String id) { return syBrandService.getById(id); }
    public List<SyBrandDto.Item> getList(SyBrandDto.Request req) { return syBrandService.getList(req); }
    public SyBrandDto.PageResponse getPageData(SyBrandDto.Request req) { return syBrandService.getPageData(req); }

    @Transactional public SyBrand create(SyBrand body) { return syBrandService.create(body); }
    @Transactional public SyBrand update(String id, SyBrand body) { return syBrandService.update(id, body); }
    @Transactional public void delete(String id) { syBrandService.delete(id); }
    @Transactional public List<SyBrand> saveList(List<SyBrand> rows) { return syBrandService.saveList(rows); }
}
