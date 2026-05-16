package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiSendDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdRestockNotiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 재입고알림 서비스 — base PdRestockNotiService 위임 (thin wrapper) + send.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdRestockNotiService {

    private final PdRestockNotiService pdRestockNotiService;

    /* 키조회 */
    public PdRestockNotiDto.Item getById(String id) { return pdRestockNotiService.getById(id); }
    /* 목록조회 */
    public List<PdRestockNotiDto.Item> getList(PdRestockNotiDto.Request req) { return pdRestockNotiService.getList(req); }
    /* 페이지조회 */
    public PdRestockNotiDto.PageResponse getPageData(PdRestockNotiDto.Request req) { return pdRestockNotiService.getPageData(req); }

    @Transactional public PdRestockNoti create(PdRestockNoti body) { return pdRestockNotiService.create(body); }
    @Transactional public PdRestockNoti update(String id, PdRestockNoti body) { return pdRestockNotiService.update(id, body); }
    @Transactional public void delete(String id) { pdRestockNotiService.delete(id); }
    @Transactional public void saveList(List<PdRestockNoti> rows) { pdRestockNotiService.saveList(rows); }

    /** send — 재입고 알림 발송 */
    public void send(PdRestockNotiSendDto.Request req) {
        if (req == null || req.getIds() == null || req.getIds().isEmpty()) return;
        log.info("재입고알림 발송 요청 - ids={}", req.getIds());
    }
}
