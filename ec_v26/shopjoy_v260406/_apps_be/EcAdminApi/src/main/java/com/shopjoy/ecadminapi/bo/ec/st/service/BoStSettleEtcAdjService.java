package com.shopjoy.ecadminapi.bo.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleEtcAdjService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO StSettleEtcAdj 서비스 — base StSettleEtcAdjService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoStSettleEtcAdjService {

    private final StSettleEtcAdjService stSettleEtcAdjService;

    /* 키조회 */
    public StSettleEtcAdjDto.Item getById(String id) { return stSettleEtcAdjService.getById(id); }
    /* 목록조회 */
    public List<StSettleEtcAdjDto.Item> getList(StSettleEtcAdjDto.Request req) { return stSettleEtcAdjService.getList(req); }
    /* 페이지조회 */
    public StSettleEtcAdjDto.PageResponse getPageData(StSettleEtcAdjDto.Request req) { return stSettleEtcAdjService.getPageData(req); }

    @Transactional public StSettleEtcAdj create(StSettleEtcAdj body) { return stSettleEtcAdjService.create(body); }
    @Transactional public StSettleEtcAdj update(String id, StSettleEtcAdj body) { return stSettleEtcAdjService.update(id, body); }
    @Transactional public void delete(String id) { stSettleEtcAdjService.delete(id); }
    @Transactional public void saveList(List<StSettleEtcAdj> rows) { stSettleEtcAdjService.saveList(rows); }
}
