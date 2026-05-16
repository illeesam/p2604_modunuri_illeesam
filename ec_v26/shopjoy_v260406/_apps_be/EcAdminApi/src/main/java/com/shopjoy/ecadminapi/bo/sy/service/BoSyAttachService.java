package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 첨부파일 서비스 — base SyAttachService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyAttachService {

    private final SyAttachService syAttachService;

    /* 키조회 */
    public SyAttachDto.Item getById(String id) { return syAttachService.getById(id); }
    /* 목록조회 */
    public List<SyAttachDto.Item> getList(SyAttachDto.Request req) { return syAttachService.getList(req); }
    /* 페이지조회 */
    public SyAttachDto.PageResponse getPageData(SyAttachDto.Request req) { return syAttachService.getPageData(req); }

    @Transactional public SyAttach create(SyAttach body) { return syAttachService.create(body); }
    @Transactional public SyAttach update(String id, SyAttach body) { return syAttachService.update(id, body); }
    @Transactional public void delete(String id) { syAttachService.delete(id); }
    @Transactional public void saveList(List<SyAttach> rows) { syAttachService.saveList(rows); }
}
