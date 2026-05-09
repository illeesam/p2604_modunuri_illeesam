package com.shopjoy.ecadminapi.bo.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import com.shopjoy.ecadminapi.base.ec.st.service.StReconService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO StRecon 서비스 — base StReconService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoStReconService {

    private final StReconService stReconService;

    public StReconDto.Item getById(String id) { return stReconService.getById(id); }
    public List<StReconDto.Item> getList(StReconDto.Request req) { return stReconService.getList(req); }
    public StReconDto.PageResponse getPageData(StReconDto.Request req) { return stReconService.getPageData(req); }

    @Transactional public StRecon create(StRecon body) { return stReconService.create(body); }
    @Transactional public StRecon update(String id, StRecon body) { return stReconService.update(id, body); }
    @Transactional public void delete(String id) { stReconService.delete(id); }
    @Transactional public List<StRecon> saveList(List<StRecon> rows) { return stReconService.saveList(rows); }
}
