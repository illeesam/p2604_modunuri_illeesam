package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FO 주문 서비스 — 주문 생성 및 내 주문 조회
 * URL: /api/fo/ec/od/order
 */
@Service
@RequiredArgsConstructor
public class FoOdOrderService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final OdOrderMapper     mapper;
    private final OdOrderRepository repository;

    @Transactional(readOnly = true)
    public List<OdOrderDto> getMyOrders(String siteId) {
        String memberId = SecurityUtil.currentUserId();
        return mapper.selectList(Map.of("memberId", memberId, "siteId", siteId != null ? siteId : ""));
    }

    @Transactional(readOnly = true)
    public PageResult<OdOrderDto> getMyOrderPage(String siteId, int pageNo, int pageSize) {
        String memberId = SecurityUtil.currentUserId();
        Map<String, Object> p = new HashMap<>();
        p.put("memberId", memberId);
        if (siteId != null) p.put("siteId", siteId);
        p.put("limit",  pageSize);
        p.put("offset", (pageNo - 1) * pageSize);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), pageNo, pageSize, p);
    }

    @Transactional(readOnly = true)
    public OdOrderDto getById(String orderId) {
        OdOrderDto dto = mapper.selectById(orderId);
        if (dto == null) throw new CmBizException("존재하지 않는 주문입니다: " + orderId);
        if (!dto.getMemberId().equals(SecurityUtil.currentUserId()))
            throw new CmBizException("접근 권한이 없습니다.");
        return dto;
    }

    @Transactional
    public OdOrder placeOrder(OdOrder entity) {
        entity.setOrderId(generateId());
        entity.setMemberId(SecurityUtil.currentUserId());
        entity.setOrderStatusCd("PENDING");
        entity.setRegBy(SecurityUtil.currentUserId());
        entity.setRegDate(LocalDateTime.now());
        return repository.save(entity);
    }

    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int) (Math.random() * 10000));
        return "OD" + ts + rand;
    }
}
