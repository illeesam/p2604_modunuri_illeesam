package com.shopjoy.ecadminapi.bo.ec.od.service;

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
import com.shopjoy.ecadminapi.base.ec.od.service.OdOrderService;
import com.shopjoy.ecadminapi.base.ec.od.service.OdPayService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * BO 주문 서비스 — base OdOrderService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoOdOrderService {

    private final OdOrderService         odOrderService;
    private final OdOrderRepository      odOrderRepository;
    private final OdOrderItemService     odOrderItemService;
    private final OdPayService           odPayService;
    private final OdDlivService          odDlivService;
    private final OdOrderDiscntService   odOrderDiscntService;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public OdOrderDto.Item getById(String id) {
        OdOrderDto.Item dto = odOrderService.getById(id);
        _itemFillRelations(dto);
        return dto;
    }
    /* 목록조회 */
    public List<OdOrderDto.Item> getList(OdOrderDto.Request req) {
        List<OdOrderDto.Item> list = odOrderService.getList(req);
        _listFillRelations(list);
        return list;
    }
    /* 페이지조회 */
    public OdOrderDto.PageResponse getPageData(OdOrderDto.Request req) {
        OdOrderDto.PageResponse res = odOrderService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** _itemFillRelations — 단건 연관조회 (items/pays/dlivs/discnts 채우기) */
    private void _itemFillRelations(OdOrderDto.Item order) {
        if (order == null) return;
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

    @Transactional public OdOrder create(OdOrder body) {
        if (body.getOrderStatusCd() == null) body.setOrderStatusCd("PENDING");
        return odOrderService.create(body);
    }
    @Transactional public OdOrder update(String id, OdOrder body) { return odOrderService.update(id, body); }
    @Transactional public void delete(String id) { odOrderService.delete(id); }
    @Transactional public void saveList(List<OdOrder> rows) { odOrderService.saveList(rows); }

    /** changeStatus — orderStatusCd 변경 (이력 보존) */
    @Transactional
    public OdOrderDto.Item changeStatus(String id, String statusCd) {
        OdOrder entity = odOrderRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setOrderStatusCdBefore(entity.getOrderStatusCd());
        entity.setOrderStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return odOrderService.getById(id);
    }
}
