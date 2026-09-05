package com.shopjoy.ecBeBo.bo.ec.od.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrderItem;
import com.shopjoy.ecBeBo.base.ec.od.service.OdOrderItemService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 주문항목 서비스 — base OdOrderItemService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoOdOrderItemService {

    private final OdOrderItemService odOrderItemService;

    public OdOrderItemDto.Item getById(String id) {
        return odOrderItemService.getById(id);
    }

    public List<OdOrderItemDto.Item> getList(OdOrderItemDto.Request req) {
        return odOrderItemService.getList(req);
    }

    public BasePage<OdOrderItemDto.Item> getPageData(OdOrderItemDto.Request req) {
        return odOrderItemService.getPageData(req);
    }

    @Transactional
    public OdOrderItem updateSelective(OdOrderItem entity) {
        return odOrderItemService.updateSelective(entity);
    }
}
