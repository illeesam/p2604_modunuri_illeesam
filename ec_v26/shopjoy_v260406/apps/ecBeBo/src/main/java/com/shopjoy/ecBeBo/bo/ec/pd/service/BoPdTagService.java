package com.shopjoy.ecBeBo.bo.ec.pd.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecBeBo.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecBeBo.base.ec.pd.service.PdTagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO PdTag 서비스 — base PdTagService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdTagService {

    private final PdTagService pdTagService;

    /* 키조회 */
    public PdTagDto.Item getById(String id) { return pdTagService.getById(id); }
    /* 목록조회 */
    public List<PdTagDto.Item> getList(PdTagDto.Request req) { return pdTagService.getList(req); }
    /* 페이지조회 */
    public BasePage<PdTagDto.Item> getPageData(PdTagDto.Request req) { return pdTagService.getPageData(req); }

    @Transactional public PdTag create(PdTag body) { return pdTagService.create(body); }
    @Transactional public PdTag update(String id, PdTag body) { return pdTagService.update(id, body); }
    @Transactional public void delete(String id) { pdTagService.delete(id); }
    @Transactional public void saveListBase(List<PdTag> rows) { pdTagService.saveListBase(rows); }
}
