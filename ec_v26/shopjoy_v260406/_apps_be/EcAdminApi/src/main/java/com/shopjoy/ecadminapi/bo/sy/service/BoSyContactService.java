package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.service.SyContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 문의 서비스 — base SyContactService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyContactService {

    private final SyContactService syContactService;

    /* 키조회 */
    public SyContactDto.Item getById(String id) { return syContactService.getById(id); }
    /* 목록조회 */
    public List<SyContactDto.Item> getList(SyContactDto.Request req) { return syContactService.getList(req); }
    /* 페이지조회 */
    public SyContactDto.PageResponse getPageData(SyContactDto.Request req) { return syContactService.getPageData(req); }

    @Transactional public SyContact create(SyContact body) { return syContactService.create(body); }
    @Transactional public SyContact update(String id, SyContact body) { return syContactService.update(id, body); }
    @Transactional public void delete(String id) { syContactService.delete(id); }
    @Transactional public void saveList(List<SyContact> rows) { syContactService.saveList(rows); }
}
