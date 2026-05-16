package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecadminapi.base.ec.od.service.OdDlivService;
import com.shopjoy.ecadminapi.base.ec.od.service.OdOrderDiscntService;
import com.shopjoy.ecadminapi.base.ec.od.service.OdOrderItemService;
import com.shopjoy.ecadminapi.base.ec.od.service.OdPayService;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * FO 주문 서비스 — 주문 생성 및 내 주문 조회
 * URL: /api/fo/ec/od/order
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoOdOrderService {

    private final OdOrderRepository      odOrderRepository;
    private final OdOrderItemService     odOrderItemService;
    private final OdPayService           odPayService;
    private final OdDlivService          odDlivService;
    private final OdOrderDiscntService   odOrderDiscntService;

    /** getMyOrders — 조회 */
    public List<OdOrderDto.Item> getMyOrders(OdOrderDto.Request req) {
        if (req == null) req = new OdOrderDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        List<OdOrderDto.Item> list = odOrderRepository.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /** getMyOrderPage — 조회 */
    public OdOrderDto.PageResponse getMyOrderPage(OdOrderDto.Request req) {
        if (req == null) req = new OdOrderDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        PageHelper.addPaging(req);
        OdOrderDto.PageResponse res = odOrderRepository.selectPageList(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** getById — 조회 */
    public OdOrderDto.Item getById(String orderId) {
        OdOrderDto.Item dto = odOrderRepository.selectById(orderId).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 주문입니다: " + orderId + "::" + CmUtil.svcCallerInfo(this));
        if (!dto.getMemberId().equals(SecurityUtil.getAuthUser().authId()))
            throw new CmBizException("접근 권한이 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(dto);
        return dto;
    }

    /** _itemFillRelations — 단건 연관조회 (items/pays/dlivs/discnts 채우기) */
    private void _itemFillRelations(OdOrderDto.Item order) {
        String orderId = order.getOrderId();

        // 하위 주문상품 목록 조회 (orderId 기준)
        OdOrderItemDto.Request itemReq = new OdOrderItemDto.Request();
        itemReq.setOrderId(orderId);
        order.setItems(odOrderItemService.getList(itemReq)); // 주문상품목록

        // 하위 결제 목록 조회 (orderId 기준)
        OdPayDto.Request payReq = new OdPayDto.Request();
        payReq.setOrderId(orderId);
        order.setPays(odPayService.getList(payReq)); // 결제목록

        // 하위 배송 목록 조회 (orderId 기준)
        OdDlivDto.Request dlivReq = new OdDlivDto.Request();
        dlivReq.setOrderId(orderId);
        order.setDlivs(odDlivService.getList(dlivReq)); // 배송목록

        // 하위 주문할인 목록 조회 (orderId 기준)
        OdOrderDiscntDto.Request dscReq = new OdOrderDiscntDto.Request();
        dscReq.setOrderId(orderId);
        order.setDiscnts(odOrderDiscntService.getList(dscReq)); // 주문할인목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (items/pays/dlivs/discnts 를 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 item 1회 + pay 1회 + dliv 1회 + discnt 1회만 조회한다.
     */
    private void _listFillRelations(List<OdOrderDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> orderIds = list.stream()
            .map(OdOrderDto.Item::getOrderId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (orderIds.isEmpty()) return;

        // 주문상품 일괄조회 → Map<orderId, List<item>>
        OdOrderItemDto.Request itemReq = new OdOrderItemDto.Request();
        itemReq.setOrderIds(orderIds);
        Map<String, List<OdOrderItemDto.Item>> itemMap = odOrderItemService.getList(itemReq).stream()
            .collect(Collectors.groupingBy(OdOrderItemDto.Item::getOrderId));

        // 결제 일괄조회 → Map<orderId, List<pay>>
        OdPayDto.Request payReq = new OdPayDto.Request();
        payReq.setOrderIds(orderIds);
        Map<String, List<OdPayDto.Item>> payMap = odPayService.getList(payReq).stream()
            .collect(Collectors.groupingBy(OdPayDto.Item::getOrderId));

        // 배송 일괄조회 → Map<orderId, List<dliv>>
        OdDlivDto.Request dlivReq = new OdDlivDto.Request();
        dlivReq.setOrderIds(orderIds);
        Map<String, List<OdDlivDto.Item>> dlivMap = odDlivService.getList(dlivReq).stream()
            .collect(Collectors.groupingBy(OdDlivDto.Item::getOrderId));

        // 주문할인 일괄조회 → Map<orderId, List<discnt>>
        OdOrderDiscntDto.Request dscReq = new OdOrderDiscntDto.Request();
        dscReq.setOrderIds(orderIds);
        Map<String, List<OdOrderDiscntDto.Item>> dscMap = odOrderDiscntService.getList(dscReq).stream()
            .collect(Collectors.groupingBy(OdOrderDiscntDto.Item::getOrderId));

        // 각 항목에 분배
        for (OdOrderDto.Item order : list) {
            String oid = order.getOrderId();
            order.setItems(itemMap.getOrDefault(oid, List.of())); // 주문상품목록
            order.setPays(payMap.getOrDefault(oid, List.of())); // 결제목록
            order.setDlivs(dlivMap.getOrDefault(oid, List.of())); // 배송목록
            order.setDiscnts(dscMap.getOrDefault(oid, List.of())); // 주문할인목록
        }
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
        if (saved == null) throw new CmBizException("주문 생성에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }
}
