package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdImgService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdOptItemService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdOptService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdSkuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * BO PdProd 서비스 — base PdProdService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPdProdService {

    private final PdProdService         pdProdService;
    private final PdProdImgService      pdProdImgService;
    private final PdProdOptService      pdProdOptService;
    private final PdProdOptItemService  pdProdOptItemService;
    private final PdProdSkuService      pdProdSkuService;

    /* 키조회 */
    public PdProdDto.Item getById(String id) {
        PdProdDto.Item dto = pdProdService.getById(id);
        _itemFillRelations(dto);
        return dto;
    }
    /* 목록조회 */
    public List<PdProdDto.Item> getList(PdProdDto.Request req) {
        List<PdProdDto.Item> list = pdProdService.getList(req);
        _listFillRelations(list);
        return list;
    }
    /* 페이지조회 */
    public PdProdDto.PageResponse getPageData(PdProdDto.Request req) {
        PdProdDto.PageResponse res = pdProdService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** _itemFillRelations — 단건 연관조회 (images/opts/skus 채우기) */
    private void _itemFillRelations(PdProdDto.Item prod) {
        if (prod == null) return;
        String prodId = prod.getProdId();

        // 하위 상품이미지 목록 조회 (prodId 기준)
        PdProdImgDto.Request imgReq = new PdProdImgDto.Request();
        imgReq.setProdId(prodId);
        List<PdProdImgDto.Item> prodImgs = pdProdImgService.getList(imgReq);

        // 하위 옵션그룹 목록 조회 (prodId 기준)
        PdProdOptDto.Request optReq = new PdProdOptDto.Request();
        optReq.setProdId(prodId);
        List<PdProdOptDto.Item> prodOpts = pdProdOptService.getList(optReq);

        // 하위 옵션항목 목록 조회 (prodId 기준)
        PdProdOptItemDto.Request itemReq = new PdProdOptItemDto.Request();
        itemReq.setProdId(prodId);
        List<PdProdOptItemDto.Item> prodOptItems = pdProdOptItemService.getList(itemReq);

        // 하위 SKU 목록 조회 (prodId 기준)
        PdProdSkuDto.Request skuReq = new PdProdSkuDto.Request();
        skuReq.setProdId(prodId);
        List<PdProdSkuDto.Item> prodSkus = pdProdSkuService.getList(skuReq);

        prod.setProdImgs(prodImgs); // 이미지목록
        prod.setProdOpts(prodOpts); // 옵션목록
        prod.setProdOptItems(prodOptItems); // 옵션아이템목록
        prod.setProdSkus(prodSkus); // SKU목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (images/opts/skus 를 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 img 1회 + opt 1회 + optItem 1회 + sku 1회만 조회한다.
     */
    private void _listFillRelations(List<PdProdDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> prodIds = list.stream()
            .map(PdProdDto.Item::getProdId)
            .filter(java.util.Objects::nonNull)
            .distinct()
            .toList();
        if (prodIds.isEmpty()) return;

        // 이미지 일괄조회 → Map<prodId, List<img>>
        PdProdImgDto.Request imgReq = new PdProdImgDto.Request();
        imgReq.setProdIds(prodIds);
        Map<String, List<PdProdImgDto.Item>> imgMap = pdProdImgService.getList(imgReq).stream()
            .collect(java.util.stream.Collectors.groupingBy(PdProdImgDto.Item::getProdId));

        // 옵션그룹 일괄조회 → Map<prodId, List<group>> + optId→prodId 매핑
        PdProdOptDto.Request optReq = new PdProdOptDto.Request();
        optReq.setProdIds(prodIds);
        List<PdProdOptDto.Item> allGroups = pdProdOptService.getList(optReq);
        Map<String, List<PdProdOptDto.Item>> groupMap = allGroups.stream()
            .collect(java.util.stream.Collectors.groupingBy(PdProdOptDto.Item::getProdId));
        Map<String, String> optIdToProdId = allGroups.stream()
            .collect(java.util.stream.Collectors.toMap(
                PdProdOptDto.Item::getOptId, PdProdOptDto.Item::getProdId, (a, b) -> a));

        // 옵션아이템 일괄조회 → optId 경유로 prodId 그룹핑 (optItem 에는 prodId 필드 없음)
        PdProdOptItemDto.Request itemReq = new PdProdOptItemDto.Request();
        itemReq.setProdIds(prodIds);
        Map<String, List<PdProdOptItemDto.Item>> itemMap = pdProdOptItemService.getList(itemReq).stream()
            .filter(it -> optIdToProdId.get(it.getOptId()) != null)
            .collect(java.util.stream.Collectors.groupingBy(it -> optIdToProdId.get(it.getOptId())));

        // SKU 일괄조회 → Map<prodId, List<sku>>
        PdProdSkuDto.Request skuReq = new PdProdSkuDto.Request();
        skuReq.setProdIds(prodIds);
        Map<String, List<PdProdSkuDto.Item>> skuMap = pdProdSkuService.getList(skuReq).stream()
            .collect(java.util.stream.Collectors.groupingBy(PdProdSkuDto.Item::getProdId));

        // 각 항목에 분배
        for (PdProdDto.Item prod : list) {
            String pid = prod.getProdId();
            prod.setProdImgs(imgMap.getOrDefault(pid, List.of())); // 이미지목록
            prod.setProdOpts(groupMap.getOrDefault(pid, List.of())); // 옵션목록
            prod.setProdOptItems(itemMap.getOrDefault(pid, List.of())); // 옵션아이템목록
            prod.setProdSkus(skuMap.getOrDefault(pid, List.of())); // SKU목록
        }
    }

    @Transactional public PdProd create(PdProd body) { return pdProdService.create(body); }
    @Transactional public PdProd update(String id, PdProd body) { return pdProdService.update(id, body); }
    @Transactional public void delete(String id) { pdProdService.delete(id); }
    @Transactional public void saveList(List<PdProd> rows) { pdProdService.saveList(rows); }
}
