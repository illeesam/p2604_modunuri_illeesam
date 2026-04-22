package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
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
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

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
    public List<OdOrderDto> getMyOrders(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().userId());
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<OdOrderDto> getMyOrderPage(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().userId());
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public OdOrderDto getById(String orderId) {
        OdOrderDto dto = mapper.selectById(orderId);
        if (dto == null) throw new CmBizException("존재하지 않는 주문입니다: " + orderId);
        if (!dto.getMemberId().equals(SecurityUtil.getAuthUser().userId()))
            throw new CmBizException("접근 권한이 없습니다.");
        return dto;
    }

    @Transactional
    public OdOrder placeOrder(OdOrder entity) {
        entity.setOrderId(generateId());
        entity.setMemberId(SecurityUtil.getAuthUser().userId());
        entity.setOrderStatusCd("PENDING");
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        return repository.save(entity);
    }

    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int) (Math.random() * 10000));
        return "OD" + ts + rand;
    }
}
