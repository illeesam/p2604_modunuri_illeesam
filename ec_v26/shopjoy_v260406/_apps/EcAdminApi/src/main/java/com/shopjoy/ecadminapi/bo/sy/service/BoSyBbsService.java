package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.service.SyBbsService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 게시판 서비스 — base SyBbsService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyBbsService {

    private final SyBbsService syBbsService;

    public SyBbsDto.Item getById(String id) { return syBbsService.getById(id); }
    public List<SyBbsDto.Item> getList(SyBbsDto.Request req) { return syBbsService.getList(req); }
    public SyBbsDto.PageResponse getPageData(SyBbsDto.Request req) { return syBbsService.getPageData(req); }

    @Transactional public SyBbs create(SyBbs body) { return syBbsService.create(body); }
    @Transactional public SyBbs update(String id, SyBbs body) { return syBbsService.update(id, body); }
    @Transactional public void delete(String id) { syBbsService.delete(id); }
    @Transactional public void saveList(List<SyBbs> rows) { syBbsService.saveList(rows); }
}
