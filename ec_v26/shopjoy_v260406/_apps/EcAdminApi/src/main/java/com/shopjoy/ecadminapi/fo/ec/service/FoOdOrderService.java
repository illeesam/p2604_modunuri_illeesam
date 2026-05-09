package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * FO 주문 서비스 — 주문 생성 및 내 주문 조회
 * URL: /api/fo/ec/od/order
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoOdOrderService {

    private final OdOrderMapper odOrderMapper;
    private final OdOrderRepository odOrderRepository;

    /** getMyOrders — 조회 */
    public List<OdOrderDto.Item> getMyOrders(OdOrderDto.Request req) {
        if (req == null) req = new OdOrderDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        return odOrderMapper.selectList(req);
    }

    /** getMyOrderPage — 조회 */
    public OdOrderDto.PageResponse getMyOrderPage(OdOrderDto.Request req) {
        if (req == null) req = new OdOrderDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        PageHelper.addPaging(req);
        OdOrderDto.PageResponse res = new OdOrderDto.PageResponse();
        List<OdOrderDto.Item> list = odOrderMapper.selectPageList(req);
        long count = odOrderMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** getById — 조회 */
    public OdOrderDto.Item getById(String orderId) {
        OdOrderDto.Item dto = odOrderMapper.selectById(orderId);
        if (dto == null) throw new CmBizException("존재하지 않는 주문입니다: " + orderId);
        if (!dto.getMemberId().equals(SecurityUtil.getAuthUser().authId()))
            throw new CmBizException("접근 권한이 없습니다.");
        return dto;
    }

    /** placeOrder */
    @Transactional
    public OdOrder placeOrder(OdOrder entity) {
        entity.setOrderId(CmUtil.generateId("od_order"));
        entity.setMemberId(SecurityUtil.getAuthUser().authId());
        entity.setOrderStatusCd("PENDING");
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(entity);
        if (saved == null) throw new CmBizException("주문 생성에 실패했습니다.");
        return saved;
    }
}
