package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdImgService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdOptService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdSkuService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    public BasePage<PdProdDto.Item> getPageData(PdProdDto.Request req) {
        BasePage<PdProdDto.Item> res = pdProdService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** _itemFillRelations — 단건 연관조회 (images/optTypes/opts/skus 채우기) */
    private void _itemFillRelations(PdProdDto.Item prod) {
        if (prod == null) return;
        String prodId = prod.getProdId();

        // 이미지 목록
        PdProdImgDto.Request imgReq = new PdProdImgDto.Request();
        imgReq.setProdId(prodId);
        prod.setProdImgs(pdProdImgService.getList(imgReq));


        // 옵션값 목록 (pd_prod_opt) — prodId 직접 필터
        PdProdOptDto.Request optReq = new PdProdOptDto.Request();
        optReq.setProdId(prodId);
        prod.setProdOpts(pdProdOptService.getList(optReq));

        // SKU 목록
        PdProdSkuDto.Request skuReq = new PdProdSkuDto.Request();
        skuReq.setProdId(prodId);
        List<PdProdSkuDto.Item> skus = pdProdSkuService.getList(skuReq);
        prod.setProdSkus(skus);
        prod.setProdStock(skus.stream()
            .filter(s -> !"N".equals(s.getUseYn()))
            .mapToInt(s -> s.getStock() != null ? s.getStock() : 0)
            .sum());
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회.
     * N개 상품에 대해 img/optType/opt/sku 각 1회 쿼리 후 분배.
     */
    private void _listFillRelations(List<PdProdDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        List<String> prodIds = list.stream()
            .map(PdProdDto.Item::getProdId)
            .filter(java.util.Objects::nonNull)
            .distinct()
            .toList();
        if (prodIds.isEmpty()) return;

        // 이미지 일괄조회
        PdProdImgDto.Request imgReq = new PdProdImgDto.Request();
        imgReq.setProdIds(prodIds);
        Map<String, List<PdProdImgDto.Item>> imgMap = pdProdImgService.getList(imgReq).stream()
            .collect(Collectors.groupingBy(PdProdImgDto.Item::getProdId));

        // 옵션값 일괄조회 (pd_prod_opt) — prodId 직접 보유하므로 JOIN 없음
        PdProdOptDto.Request optReq = new PdProdOptDto.Request();
        optReq.setProdIds(prodIds);
        Map<String, List<PdProdOptDto.Item>> optMap = pdProdOptService.getList(optReq).stream()
            .collect(Collectors.groupingBy(PdProdOptDto.Item::getProdId));

        // SKU 일괄조회
        PdProdSkuDto.Request skuReq = new PdProdSkuDto.Request();
        skuReq.setProdIds(prodIds);
        Map<String, List<PdProdSkuDto.Item>> skuMap = pdProdSkuService.getList(skuReq).stream()
            .collect(Collectors.groupingBy(PdProdSkuDto.Item::getProdId));

        // 각 항목에 분배
        for (PdProdDto.Item prod : list) {
            String pid = prod.getProdId();
            List<PdProdImgDto.Item> imgs = imgMap.getOrDefault(pid, List.of());
            prod.setProdImgs(imgs);
            prod.setProdOpts(optMap.getOrDefault(pid, List.of()));
            List<PdProdSkuDto.Item> skus = skuMap.getOrDefault(pid, List.of());
            prod.setProdSkus(skus);
            prod.setProdStock(skus.stream()
                .filter(s -> !"N".equals(s.getUseYn()))
                .mapToInt(s -> s.getStock() != null ? s.getStock() : 0)
                .sum());
            // thumbnailUrl: pd_prod.thumbnail_url 직접값 우선, 없으면 is_thumb='Y' 첫 이미지, 없으면 sortOrd 첫 이미지
            if ((prod.getThumbnailUrl() == null || prod.getThumbnailUrl().isBlank()) && !imgs.isEmpty()) {
                String thumbUrl = imgs.stream()
                    .filter(i -> "Y".equals(i.getIsThumb()))
                    .findFirst()
                    .map(PdProdImgDto.Item::getCdnImgUrl)
                    .orElseGet(() -> imgs.get(0).getCdnImgUrl());
                prod.setThumbnailUrl(thumbUrl);
            }
        }
    }

    @Transactional public PdProd create(PdProd body) { return pdProdService.create(body); }
    @Transactional public PdProd update(String id, PdProd body) { return pdProdService.update(id, body); }
    @Transactional public void delete(String id) { pdProdService.delete(id); }
    @Transactional public void saveListBase(List<PdProd> rows) { pdProdService.saveListBase(rows); }
}
