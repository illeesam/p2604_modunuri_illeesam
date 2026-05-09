package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachGrpService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 첨부그룹 서비스 — base SyAttachGrpService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyAttachGrpService {

    private final SyAttachGrpService syAttachGrpService;

    public SyAttachGrpDto.Item getById(String id) { return syAttachGrpService.getById(id); }
    public List<SyAttachGrpDto.Item> getList(SyAttachGrpDto.Request req) { return syAttachGrpService.getList(req); }
    public SyAttachGrpDto.PageResponse getPageData(SyAttachGrpDto.Request req) { return syAttachGrpService.getPageData(req); }

    @Transactional public SyAttachGrp create(SyAttachGrp body) { return syAttachGrpService.create(body); }
    @Transactional public SyAttachGrp update(String id, SyAttachGrp body) { return syAttachGrpService.update(id, body); }
    @Transactional public void delete(String id) { syAttachGrpService.delete(id); }
    @Transactional public void saveList(List<SyAttachGrp> rows) { syAttachGrpService.saveList(rows); }
}
