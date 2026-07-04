package com.shopjoy.ecadminapi.bo.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderItemRepository;
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
    private final OdOrderItemRepository  odOrderItemRepository;
    private final OdPayService           odPayService;
    private final OdDlivService          odDlivService;
    private final OdOrderDiscntService   odOrderDiscntService;
    private final BoOdClaimService       boOdClaimService;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public OdOrderDto.Item getById(String id) {
        OdOrderDto.Item dto = odOrderService.getById(id);
        _itemFillRelations(dto);
        return dto;
    }

    /** 칸반 통합조회 — 주문(orderItems/orderPays/orderDlivs 포함) + 클레임 목록(claimItems 포함) 1회 응답 */
    public OdOrderDto.Kanban getKanban(String orderId) {
        OdOrderDto.Item order = getById(orderId);
        OdClaimDto.Request claimReq = new OdClaimDto.Request();
        claimReq.setOrderId(orderId);
        claimReq.setPageSize(100);
        List<OdClaimDto.Item> claims = boOdClaimService.getList(claimReq);
        OdOrderDto.Kanban kanban = new OdOrderDto.Kanban();
        kanban.setOrder(order);
        kanban.setClaims(claims);
        return kanban;
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

    /** _itemFillRelations — 단건 연관조회 (orderItems/orderPays/orderDlivs/orderDiscnts 채우기) */
    private void _itemFillRelations(OdOrderDto.Item order) {
        if (order == null) return;
        String orderId = order.getOrderId();

        // 하위 주문상품 목록 조회 (orderId 기준)
        OdOrderItemDto.Request itemReq = new OdOrderItemDto.Request();
        itemReq.setOrderId(orderId);
        order.setOrderItems(odOrderItemService.getList(itemReq)); // 주문상품목록

        // 하위 결제 목록 조회 (orderId 기준)
        OdPayDto.Request payReq = new OdPayDto.Request();
        payReq.setOrderId(orderId);
        order.setOrderPays(odPayService.getList(payReq)); // 결제목록

        // 하위 배송 목록 조회 (orderId 기준)
        OdDlivDto.Request dlivReq = new OdDlivDto.Request();
        dlivReq.setOrderId(orderId);
        order.setOrderDlivs(odDlivService.getList(dlivReq)); // 배송목록

        // 하위 주문할인 목록 조회 (orderId 기준)
        OdOrderDiscntDto.Request dscReq = new OdOrderDiscntDto.Request();
        dscReq.setOrderId(orderId);
        order.setOrderDiscnts(odOrderDiscntService.getList(dscReq)); // 주문할인목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (orderItems/orderPays/orderDlivs/orderDiscnts 를 각각 한 번의 쿼리로 조회 후 분배)
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
            order.setOrderItems(itemMap.getOrDefault(oid, List.of())); // 주문상품목록
            order.setOrderPays(payMap.getOrDefault(oid, List.of())); // 결제목록
            order.setOrderDlivs(dlivMap.getOrDefault(oid, List.of())); // 배송목록
            order.setOrderDiscnts(dscMap.getOrDefault(oid, List.of())); // 주문할인목록
        }
    }

    @Transactional public OdOrder create(OdOrder body) {
        if (body.getOrderStatusCd() == null) body.setOrderStatusCd("PENDING");
        return odOrderService.create(body);
    }
    @Transactional public OdOrder update(String id, OdOrder body) { return odOrderService.update(id, body); }
    @Transactional public void delete(String id) { odOrderService.delete(id); }
    @Transactional public void saveListBase(List<OdOrder> rows) { odOrderService.saveListBase(rows); }

    /**
     * saveProxyOrder — MD 대리주문 저장 (주문 + 주문항목 동시 저장).
     * 신규(orderId=null)면 create, 기존이면 update 후 항목 전체 교체(delete→insert).
     */
    @Transactional
    public OdOrderDto.Item saveProxyOrder(OdOrderDto.ProxyOrderRequest req) {
        if (req == null) throw new CmBizException("요청이 비어 있습니다.::" + CmUtil.svcCallerInfo(this));
        if (req.getMemberId() == null || req.getMemberId().isBlank())
            throw new CmBizException("회원ID는 필수입니다.::" + CmUtil.svcCallerInfo(this));

        boolean isNew = (req.getOrderId() == null || req.getOrderId().isBlank());
        long dlivFee = req.getDlivFee() == null ? 0L : req.getDlivFee();
        long totalAmt = req.getTotalAmt() == null ? 0L : req.getTotalAmt();
        long payAmt = req.getPayAmt() == null ? (totalAmt + dlivFee) : req.getPayAmt();

        OdOrder order;
        if (isNew) {
            order = new OdOrder();
            order.setSiteId(req.getSiteId() != null ? req.getSiteId() : SecurityUtil.getSiteId());
            order.setMemberId(req.getMemberId());
            order.setMemberNm(req.getMemberNm());
            order.setOrdererEmail(req.getOrdererEmail());
            order.setOrderDate(LocalDateTime.now());
            order.setOrderStatusCd(req.getOrderStatusCd() != null ? req.getOrderStatusCd() : "PENDING");
            order.setPayMethodCd(req.getPayMethodCd());
            order.setTotalAmt(totalAmt);
            order.setOutboundShippingFee(dlivFee);
            order.setPayAmt(payAmt);
            order.setMemo(req.getMemo());
            order = odOrderService.create(order);   // orderId 생성 + flush
        } else {
            order = odOrderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new CmBizException("존재하지 않는 주문입니다: " + req.getOrderId() + "::" + CmUtil.svcCallerInfo(this)));
            order.setMemberId(req.getMemberId());
            if (req.getMemberNm() != null)      order.setMemberNm(req.getMemberNm());
            if (req.getOrdererEmail() != null)  order.setOrdererEmail(req.getOrdererEmail());
            if (req.getOrderStatusCd() != null) order.setOrderStatusCd(req.getOrderStatusCd());
            if (req.getPayMethodCd() != null)   order.setPayMethodCd(req.getPayMethodCd());
            order.setTotalAmt(totalAmt);
            order.setOutboundShippingFee(dlivFee);
            order.setPayAmt(payAmt);
            if (req.getMemo() != null)          order.setMemo(req.getMemo());
            order.setUpdBy(SecurityUtil.getAuthUser().authId());
            order.setUpdDate(LocalDateTime.now());
            odOrderRepository.save(order);
            /* 기존 항목 전체 삭제 후 재삽입 (전체 교체 방식) */
            odOrderItemRepository.deleteByOrderId(order.getOrderId());
            em.flush();
        }

        /* 주문항목 저장 */
        final String orderId = order.getOrderId();
        final String siteId  = order.getSiteId();
        if (req.getOrderItems() != null) {
            for (OdOrderItemDto.SaveItem si : req.getOrderItems()) {
                if (si == null || si.getProdId() == null) continue;
                OdOrderItem item = new OdOrderItem();
                item.setSiteId(siteId);
                item.setOrderId(orderId);
                item.setProdId(si.getProdId());
                item.setSkuId(si.getSkuId());
                item.setProdNm(si.getProdNm());
                item.setUnitPrice(si.getUnitPrice());
                item.setOrderQty(si.getOrderQty() != null ? si.getOrderQty() : 1);
                long amt = si.getItemOrderAmt() != null ? si.getItemOrderAmt()
                    : (si.getUnitPrice() != null ? si.getUnitPrice() * (si.getOrderQty() != null ? si.getOrderQty() : 1) : 0L);
                item.setItemOrderAmt(amt);
                item.setOrderItemStatusCd("ORDERED");
                odOrderItemService.create(item);   // orderItemId 생성 + 저장
            }
        }
        em.flush();
        return getById(orderId);
    }

    /**
     * requestExtraPay — 추가결제 요청. 현재는 주문 메모에 요청 이력만 누적(별도 결재 테이블 도입 전).
     * 반환: 갱신된 주문 단건.
     */
    @Transactional
    public OdOrderDto.Item requestExtraPay(OdOrderDto.ExtraPayRequest req) {
        if (req == null || req.getOrderId() == null || req.getOrderId().isBlank())
            throw new CmBizException("orderId는 필수입니다.::" + CmUtil.svcCallerInfo(this));
        if (req.getAmount() == null || req.getAmount() <= 0)
            throw new CmBizException("요청 금액은 0보다 커야 합니다.::" + CmUtil.svcCallerInfo(this));
        OdOrder order = odOrderRepository.findById(req.getOrderId())
            .orElseThrow(() -> new CmBizException("존재하지 않는 주문입니다: " + req.getOrderId() + "::" + CmUtil.svcCallerInfo(this)));
        String line = "[추가결제요청] " + req.getAmount() + "원"
            + (req.getReason() != null && !req.getReason().isBlank() ? " / 사유: " + req.getReason() : "")
            + " (" + LocalDateTime.now() + ")";
        order.setMemo((order.getMemo() == null ? "" : order.getMemo() + "\n") + line);
        order.setUpdBy(SecurityUtil.getAuthUser().authId());
        order.setUpdDate(LocalDateTime.now());
        odOrderRepository.save(order);
        em.flush();
        return getById(order.getOrderId());
    }

    /** saveOneStatus — 단건 orderStatusCd 변경 (이력 보존). row: orderId + orderStatusCd */
    @Transactional
    public OdOrderDto.Item saveOneStatus(OdOrder row) {
        CmUtil.requireId(row == null ? null : row.getOrderId(), "orderId", this);
        OdOrder entity = odOrderRepository.findById(row.getOrderId())
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + row.getOrderId() + "::" + CmUtil.svcCallerInfo(this)));
        entity.setOrderStatusCdBefore(entity.getOrderStatusCd());
        entity.setOrderStatusCd(row.getOrderStatusCd());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return odOrderService.getById(row.getOrderId());
    }

    /** saveListStatus — 다건 주문상태 변경 (행별 orderStatusCd, 이력 보존) */
    @Transactional
    public void saveListStatus(List<OdOrder> rows) {
        if (rows == null) return;
        CmUtil.requireRowIds(rows, OdOrder::getOrderId, "U", "orderId", this);
        String updBy = SecurityUtil.getAuthUser().authId();
        for (OdOrder row : rows) {
            odOrderRepository.findById(row.getOrderId()).ifPresent(e -> {
                e.setOrderStatusCdBefore(e.getOrderStatusCd());
                e.setOrderStatusCd(row.getOrderStatusCd());
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdOrder saved = odOrderRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** saveListPayMethod — 다건 결제수단 변경 (행별 payMethodCd) */
    @Transactional
    public void saveListPayMethod(List<OdOrder> rows) {
        if (rows == null) return;
        CmUtil.requireRowIds(rows, OdOrder::getOrderId, "U", "orderId", this);
        String updBy = SecurityUtil.getAuthUser().authId();
        for (OdOrder row : rows) {
            if (row.getPayMethodCd() == null) continue;
            odOrderRepository.findById(row.getOrderId()).ifPresent(e -> {
                e.setPayMethodCd(row.getPayMethodCd());
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdOrder saved = odOrderRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** saveListApproval — 다건 결재 처리 (updBy/updDate 갱신) */
    @Transactional
    public void saveListApproval(List<OdOrder> rows) {
        if (rows == null) return;
        CmUtil.requireRowIds(rows, OdOrder::getOrderId, "U", "orderId", this);
        String updBy = SecurityUtil.getAuthUser().authId();
        for (OdOrder row : rows) {
            odOrderRepository.findById(row.getOrderId()).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdOrder saved = odOrderRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }

    /** saveListApprovalReq — 다건 결재 요청 (updBy/updDate 갱신) */
    @Transactional
    public void saveListApprovalReq(List<OdOrder> rows) {
        if (rows == null) return;
        CmUtil.requireRowIds(rows, OdOrder::getOrderId, "U", "orderId", this);
        String updBy = SecurityUtil.getAuthUser().authId();
        for (OdOrder row : rows) {
            odOrderRepository.findById(row.getOrderId()).ifPresent(e -> {
                e.setUpdBy(updBy);
                e.setUpdDate(LocalDateTime.now());
                OdOrder saved = odOrderRepository.save(e);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            });
        }
    }
}
