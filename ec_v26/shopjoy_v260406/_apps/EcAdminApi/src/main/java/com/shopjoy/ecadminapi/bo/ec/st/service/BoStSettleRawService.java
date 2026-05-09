package com.shopjoy.ecadminapi.bo.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleRawService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO StSettleRaw 서비스 — base StSettleRawService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoStSettleRawService {

    private final StSettleRawService stSettleRawService;

    public StSettleRawDto.Item getById(String id) { return stSettleRawService.getById(id); }
    public List<StSettleRawDto.Item> getList(StSettleRawDto.Request req) { return stSettleRawService.getList(req); }
    public StSettleRawDto.PageResponse getPageData(StSettleRawDto.Request req) { return stSettleRawService.getPageData(req); }

    @Transactional public StSettleRaw create(StSettleRaw body) { return stSettleRawService.create(body); }
    @Transactional public StSettleRaw update(String id, StSettleRaw body) { return stSettleRawService.update(id, body); }
    @Transactional public void delete(String id) { stSettleRawService.delete(id); }
    @Transactional public List<StSettleRaw> saveList(List<StSettleRaw> rows) { return stSettleRawService.saveList(rows); }
}
