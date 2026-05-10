package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.service.SyBatchService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 배치 서비스 — base SyBatchService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyBatchService {

    private final SyBatchService syBatchService;

    public SyBatchDto.Item getById(String id) { return syBatchService.getById(id); }
    public List<SyBatchDto.Item> getList(SyBatchDto.Request req) { return syBatchService.getList(req); }
    public SyBatchDto.PageResponse getPageData(SyBatchDto.Request req) { return syBatchService.getPageData(req); }

    @Transactional public SyBatch create(SyBatch body) { return syBatchService.create(body); }
    @Transactional public SyBatch update(String id, SyBatch body) { return syBatchService.update(id, body); }
    @Transactional public void delete(String id) { syBatchService.delete(id); }
    @Transactional public void saveList(List<SyBatch> rows) { syBatchService.saveList(rows); }
}
