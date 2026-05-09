package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdRestockNotiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * BO 재입고알림 서비스 — base PdRestockNotiService 위임 (thin wrapper) + send.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdRestockNotiService {

    private final PdRestockNotiService pdRestockNotiService;

    public PdRestockNotiDto.Item getById(String id) { return pdRestockNotiService.getById(id); }
    public List<PdRestockNotiDto.Item> getList(PdRestockNotiDto.Request req) { return pdRestockNotiService.getList(req); }
    public PdRestockNotiDto.PageResponse getPageData(PdRestockNotiDto.Request req) { return pdRestockNotiService.getPageData(req); }

    @Transactional public PdRestockNoti create(PdRestockNoti body) { return pdRestockNotiService.create(body); }
    @Transactional public PdRestockNoti update(String id, PdRestockNoti body) { return pdRestockNotiService.update(id, body); }
    @Transactional public void delete(String id) { pdRestockNotiService.delete(id); }
    @Transactional public List<PdRestockNoti> saveList(List<PdRestockNoti> rows) { return pdRestockNotiService.saveList(rows); }

    /** send — 재입고 알림 발송 */
    public void send(Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> ids = (List<String>) body.get("ids");
        if (ids == null || ids.isEmpty()) return;
        log.info("재입고알림 발송 요청 - ids={}", ids);
    }
}
