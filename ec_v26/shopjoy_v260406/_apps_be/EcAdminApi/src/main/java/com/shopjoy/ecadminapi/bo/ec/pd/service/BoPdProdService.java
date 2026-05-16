package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO PdProd 서비스 — base PdProdService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdProdService {

    private final PdProdService pdProdService;

    /* 키조회 */
    public PdProdDto.Item getById(String id) { return pdProdService.getById(id); }
    /* 목록조회 */
    public List<PdProdDto.Item> getList(PdProdDto.Request req) { return pdProdService.getList(req); }
    /* 페이지조회 */
    public PdProdDto.PageResponse getPageData(PdProdDto.Request req) { return pdProdService.getPageData(req); }

    @Transactional public PdProd create(PdProd body) { return pdProdService.create(body); }
    @Transactional public PdProd update(String id, PdProd body) { return pdProdService.update(id, body); }
    @Transactional public void delete(String id) { pdProdService.delete(id); }
    @Transactional public void saveList(List<PdProd> rows) { pdProdService.saveList(rows); }
}
