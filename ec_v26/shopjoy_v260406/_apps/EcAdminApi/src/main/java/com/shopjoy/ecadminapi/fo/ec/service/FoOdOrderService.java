package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

/**
 * FO 주문 서비스 — 주문 생성 및 내 주문 조회
 * URL: /api/fo/ec/od/order
 */
@Service
@RequiredArgsConstructor
public class FoOdOrderService {


    private final OdOrderMapper     odOrderMapper;
    private final OdOrderRepository odOrderRepository;

    @Transactional(readOnly = true)
    public List<OdOrderDto> getMyOrders(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().authId());
        return odOrderMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<OdOrderDto> getMyOrderPage(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().authId());
        PageHelper.addPaging(p);
        return PageResult.of(odOrderMapper.selectPageList(p), odOrderMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public OdOrderDto getById(String orderId) {
        OdOrderDto dto = odOrderMapper.selectById(orderId);
        if (dto == null) throw new CmBizException("존재하지 않는 주문입니다: " + orderId);
        if (!dto.getMemberId().equals(SecurityUtil.getAuthUser().authId()))
            throw new CmBizException("접근 권한이 없습니다.");
        return dto;
    }

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
