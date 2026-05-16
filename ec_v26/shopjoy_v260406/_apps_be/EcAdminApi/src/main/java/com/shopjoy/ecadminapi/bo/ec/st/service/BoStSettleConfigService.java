package com.shopjoy.ecadminapi.bo.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO StSettleConfig 서비스 — base StSettleConfigService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoStSettleConfigService {

    private final StSettleConfigService stSettleConfigService;

    /* 키조회 */
    public StSettleConfigDto.Item getById(String id) { return stSettleConfigService.getById(id); }
    /* 목록조회 */
    public List<StSettleConfigDto.Item> getList(StSettleConfigDto.Request req) { return stSettleConfigService.getList(req); }
    /* 페이지조회 */
    public StSettleConfigDto.PageResponse getPageData(StSettleConfigDto.Request req) { return stSettleConfigService.getPageData(req); }

    @Transactional public StSettleConfig create(StSettleConfig body) { return stSettleConfigService.create(body); }
    @Transactional public StSettleConfig update(String id, StSettleConfig body) { return stSettleConfigService.update(id, body); }
    @Transactional public void delete(String id) { stSettleConfigService.delete(id); }
    @Transactional public void saveList(List<StSettleConfig> rows) { stSettleConfigService.saveList(rows); }
}
