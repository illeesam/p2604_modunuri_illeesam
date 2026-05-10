package com.shopjoy.ecadminapi.bo.ec.cm.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.service.SyNoticeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 공지사항 서비스 — base SyNoticeService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoCmNoticeService {

    private final SyNoticeService syNoticeService;

    public SyNoticeDto.Item getById(String id) { return syNoticeService.getById(id); }
    public List<SyNoticeDto.Item> getList(SyNoticeDto.Request req) { return syNoticeService.getList(req); }
    public SyNoticeDto.PageResponse getPageData(SyNoticeDto.Request req) { return syNoticeService.getPageData(req); }

    @Transactional public SyNotice create(SyNotice body) { return syNoticeService.create(body); }
    @Transactional public SyNotice update(String id, SyNotice body) { return syNoticeService.update(id, body); }
    @Transactional public void delete(String id) { syNoticeService.delete(id); }
    @Transactional public void saveList(List<SyNotice> rows) { syNoticeService.saveList(rows); }
}
