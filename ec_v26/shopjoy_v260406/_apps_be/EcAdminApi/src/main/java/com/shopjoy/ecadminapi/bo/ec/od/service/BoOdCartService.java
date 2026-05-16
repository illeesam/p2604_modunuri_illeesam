package com.shopjoy.ecadminapi.bo.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.base.ec.od.service.OdCartService;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdSkuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * BO OdCart 서비스 — base OdCartService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoOdCartService {

    private final OdCartService    odCartService;
    private final PdProdService    pdProdService;
    private final PdProdSkuService pdProdSkuService;

    /* 키조회 */
    public OdCartDto.Item getById(String id) {
        OdCartDto.Item dto = odCartService.getById(id);
        _itemFillRelations(dto);
        return dto;
    }
    /* 목록조회 */
    public List<OdCartDto.Item> getList(OdCartDto.Request req) {
        List<OdCartDto.Item> list = odCartService.getList(req);
        _listFillRelations(list);
        return list;
    }
    /* 페이지조회 */
    public OdCartDto.PageResponse getPageData(OdCartDto.Request req) {
        OdCartDto.PageResponse res = odCartService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** _itemFillRelations — 단건 연관조회 (prod 단건 / sku 단건 채우기) */
    private void _itemFillRelations(OdCartDto.Item cart) {
        if (cart == null || cart.getProdId() == null) return;
        List<String> prodIds = List.of(cart.getProdId());

        // 상위 상품 단건 조회 (prodId 기준)
        PdProdDto.Request prodReq = new PdProdDto.Request();
        prodReq.setProdIds(prodIds);
        Map<String, PdProdDto.Item> prodMap = pdProdService.getList(prodReq).stream()
            .collect(Collectors.toMap(PdProdDto.Item::getProdId, x -> x, (a, b) -> a));

        // 상위 SKU 단건 조회 (prodId 기준, skuId 매핑)
        PdProdSkuDto.Request skuReq = new PdProdSkuDto.Request();
        skuReq.setProdIds(prodIds);
        Map<String, PdProdSkuDto.Item> skuMap = pdProdSkuService.getList(skuReq).stream()
            .collect(Collectors.toMap(PdProdSkuDto.Item::getSkuId, x -> x, (a, b) -> a));

        cart.setProd(prodMap.get(cart.getProdId())); // 상품단건
        cart.setSku(skuMap.get(cart.getSkuId())); // SKU단건
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (prod 단건 / sku 단건을 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하지 않고, N개 행이라도 prod 1회 + sku 1회만 조회한다.
     */
    private void _listFillRelations(List<OdCartDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> prodIds = list.stream()
            .map(OdCartDto.Item::getProdId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (prodIds.isEmpty()) return;

        // 상품 일괄조회 → Map<prodId, prod>
        PdProdDto.Request prodReq = new PdProdDto.Request();
        prodReq.setProdIds(prodIds);
        Map<String, PdProdDto.Item> prodMap = pdProdService.getList(prodReq).stream()
            .collect(Collectors.toMap(PdProdDto.Item::getProdId, x -> x, (a, b) -> a));

        // SKU 일괄조회 (상품기준) → Map<skuId, sku>
        PdProdSkuDto.Request skuReq = new PdProdSkuDto.Request();
        skuReq.setProdIds(prodIds);
        Map<String, PdProdSkuDto.Item> skuMap = pdProdSkuService.getList(skuReq).stream()
            .collect(Collectors.toMap(PdProdSkuDto.Item::getSkuId, x -> x, (a, b) -> a));

        // 각 항목에 분배
        for (OdCartDto.Item cart : list) {
            cart.setProd(prodMap.get(cart.getProdId())); // 상품단건
            cart.setSku(skuMap.get(cart.getSkuId())); // SKU단건
        }
    }

    @Transactional public OdCart create(OdCart body) { return odCartService.create(body); }
    @Transactional public OdCart update(String id, OdCart body) { return odCartService.update(id, body); }
    @Transactional public void delete(String id) { odCartService.delete(id); }
    @Transactional public void saveList(List<OdCart> rows) { odCartService.saveList(rows); }
}
