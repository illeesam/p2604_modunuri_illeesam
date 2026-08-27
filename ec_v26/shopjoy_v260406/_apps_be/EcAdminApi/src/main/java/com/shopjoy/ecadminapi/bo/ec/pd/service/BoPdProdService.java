package com.shopjoy.ecadminapi.bo.ec.pd.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdImgDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdStock;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdStockRepository;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdImgService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdOptService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdSkuService;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmDiscntService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
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
    private final PdProdStockRepository pdProdStockRepository;
    private final PmDiscntService       pmDiscntService;

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

        _fillSaleCount(List.of(prod));
        _fillDiscountInfo(List.of(prod));
    }

    /** _fillSaleCount — pd_prod_stock.sale_count 를 prodId 기준 합산해 채운다 (한 상품이 여러 stock_code 를 가질 수 있음). */
    private void _fillSaleCount(List<PdProdDto.Item> list) {
        if (list == null || list.isEmpty()) return;
        List<String> prodIds = list.stream()
            .map(PdProdDto.Item::getProdId)
            .filter(java.util.Objects::nonNull)
            .distinct()
            .toList();
        if (prodIds.isEmpty()) return;

        Map<String, Integer> saleCountMap = pdProdStockRepository.selectList(Map.of("prodIds", prodIds)).stream()
            .collect(Collectors.groupingBy(PdProdStock::getProdId,
                Collectors.summingInt(s -> s.getSaleCount() != null ? s.getSaleCount() : 0)));

        for (PdProdDto.Item prod : list) {
            prod.setSaleCount(saleCountMap.getOrDefault(prod.getProdId(), 0));
        }
    }

    /**
     * _fillDiscountInfo — 상품에 직접 지정된(discntTargetCd=PRODUCT) 활성 프로모션할인 중
     * 정률/정액 상관없이 실제 할인액이 가장 큰 것을 골라 discntPrice/discntRate/appliedDiscntNm 를 채운다.
     * 카테고리/전체 대상 할인은 이 목록 화면 표시 범위에서 제외(직접 지정 할인만 — 스코프 확대는 별도 논의).
     */
    private void _fillDiscountInfo(List<PdProdDto.Item> list) {
        if (list == null || list.isEmpty()) return;
        LocalDate today = LocalDate.now();

        for (PdProdDto.Item prod : list) {
            if (prod.getProdId() == null) continue;
            Long basePrice = prod.getSalePrice() != null ? prod.getSalePrice() : prod.getStdPrice();
            if (basePrice == null || basePrice <= 0) continue;

            PmDiscntDto.Request req = new PmDiscntDto.Request();
            req.setProdId(prod.getProdId());
            req.setDiscntStatusCd("ACTIVE");
            List<PmDiscntDto.Item> candidates = pmDiscntService.getList(req);

            long bestAmt = 0;
            PmDiscntDto.Item bestDiscnt = null;
            for (PmDiscntDto.Item d : candidates) {
                if (!"Y".equals(d.getUseYn())) continue;
                if (d.getStartDate() != null && d.getStartDate().isAfter(today)) continue;
                if (d.getEndDate() != null && d.getEndDate().isBefore(today)) continue;
                if (d.getDiscntValue() == null) continue;

                long amt;
                if ("RATE".equals(d.getDiscntValTypeCd())) {
                    amt = basePrice * d.getDiscntValue().longValue() / 100;
                    if (d.getMaxDiscntAmt() != null && amt > d.getMaxDiscntAmt()) amt = d.getMaxDiscntAmt();
                } else if ("AMOUNT".equals(d.getDiscntValTypeCd())) {
                    amt = d.getDiscntValue().longValue();
                } else {
                    continue; // SHIP_FREE 등 가격 표시 대상 아님
                }
                if (amt > bestAmt) { bestAmt = amt; bestDiscnt = d; }
            }

            if (bestDiscnt != null && bestAmt > 0) {
                long finalPrice = Math.max(0, basePrice - bestAmt);
                prod.setDiscntPrice(finalPrice);
                prod.setAppliedDiscntNm(bestDiscnt.getDiscntNm());
                prod.setDiscntRate((int) Math.round(bestAmt * 100.0 / basePrice));
            }
        }
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

        _fillSaleCount(list);
        _fillDiscountInfo(list);
    }

    @Transactional public PdProd create(PdProd body) { return pdProdService.create(body); }
    @Transactional public PdProd update(String id, PdProd body) { return pdProdService.update(id, body); }
    @Transactional public void delete(String id) { pdProdService.delete(id); }
    @Transactional public void saveListBase(List<PdProd> rows) { pdProdService.saveListBase(rows); }
}
