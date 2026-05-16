package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdDlivTmpltService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO PdDlivTmplt 서비스 — base PdDlivTmpltService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdDlivTmpltService {

    private final PdDlivTmpltService pdDlivTmpltService;

    /* 키조회 */
    public PdDlivTmpltDto.Item getById(String id) { return pdDlivTmpltService.getById(id); }
    /* 목록조회 */
    public List<PdDlivTmpltDto.Item> getList(PdDlivTmpltDto.Request req) { return pdDlivTmpltService.getList(req); }
    /* 페이지조회 */
    public PdDlivTmpltDto.PageResponse getPageData(PdDlivTmpltDto.Request req) { return pdDlivTmpltService.getPageData(req); }

    @Transactional public PdDlivTmplt create(PdDlivTmplt body) { return pdDlivTmpltService.create(body); }
    @Transactional public PdDlivTmplt update(String id, PdDlivTmplt body) { return pdDlivTmpltService.update(id, body); }
    @Transactional public void delete(String id) { pdDlivTmpltService.delete(id); }
    @Transactional public void saveList(List<PdDlivTmplt> rows) { pdDlivTmpltService.saveList(rows); }
}
