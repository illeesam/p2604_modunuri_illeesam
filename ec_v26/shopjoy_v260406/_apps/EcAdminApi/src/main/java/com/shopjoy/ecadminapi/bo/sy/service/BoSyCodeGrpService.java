package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.service.SyCodeGrpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 공통코드그룹 서비스 — base SyCodeGrpService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyCodeGrpService {

    private final SyCodeGrpService syCodeGrpService;

    public SyCodeGrpDto.Item getById(String id) { return syCodeGrpService.getById(id); }
    public List<SyCodeGrpDto.Item> getList(SyCodeGrpDto.Request req) { return syCodeGrpService.getList(req); }
    public SyCodeGrpDto.PageResponse getPageData(SyCodeGrpDto.Request req) { return syCodeGrpService.getPageData(req); }

    @Transactional public SyCodeGrp create(SyCodeGrp body) { return syCodeGrpService.create(body); }
    @Transactional public SyCodeGrp update(String id, SyCodeGrp body) { return syCodeGrpService.update(id, body); }
    @Transactional public void delete(String id) { syCodeGrpService.delete(id); }
    @Transactional public List<SyCodeGrp> saveList(List<SyCodeGrp> rows) { return syCodeGrpService.saveList(rows); }
}
