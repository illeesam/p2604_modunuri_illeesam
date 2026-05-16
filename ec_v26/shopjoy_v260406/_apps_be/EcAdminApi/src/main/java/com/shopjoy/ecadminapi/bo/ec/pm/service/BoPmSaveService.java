package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO PmSave 서비스 — base PmSaveService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPmSaveService {

    private final PmSaveService pmSaveService;

    /* 키조회 */
    public PmSaveDto.Item getById(String id) { return pmSaveService.getById(id); }
    /* 목록조회 */
    public List<PmSaveDto.Item> getList(PmSaveDto.Request req) { return pmSaveService.getList(req); }
    /* 페이지조회 */
    public PmSaveDto.PageResponse getPageData(PmSaveDto.Request req) { return pmSaveService.getPageData(req); }

    @Transactional public PmSave create(PmSave body) { return pmSaveService.create(body); }
    @Transactional public PmSave update(String id, PmSave body) { return pmSaveService.update(id, body); }
    @Transactional public void delete(String id) { pmSaveService.delete(id); }
    @Transactional public void saveList(List<PmSave> rows) { pmSaveService.saveList(rows); }
}
