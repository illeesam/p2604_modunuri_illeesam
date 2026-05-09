package com.shopjoy.ecadminapi.bo.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.base.ec.od.service.OdCartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO OdCart 서비스 — base OdCartService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoOdCartService {

    private final OdCartService odCartService;

    public OdCartDto.Item getById(String id) { return odCartService.getById(id); }
    public List<OdCartDto.Item> getList(OdCartDto.Request req) { return odCartService.getList(req); }
    public OdCartDto.PageResponse getPageData(OdCartDto.Request req) { return odCartService.getPageData(req); }

    @Transactional public OdCart create(OdCart body) { return odCartService.create(body); }
    @Transactional public OdCart update(String id, OdCart body) { return odCartService.update(id, body); }
    @Transactional public void delete(String id) { odCartService.delete(id); }
    @Transactional public List<OdCart> saveList(List<OdCart> rows) { return odCartService.saveList(rows); }
}
