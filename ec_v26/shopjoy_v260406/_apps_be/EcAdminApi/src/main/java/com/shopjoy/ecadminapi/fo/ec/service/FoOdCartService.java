package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdCartRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdService;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdSkuService;
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
 * FO 장바구니 서비스 — 현재 로그인 회원의 장바구니 관리
 * URL: /api/fo/ec/od/cart
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoOdCartService {


    private final OdCartRepository odCartRepository;
    private final PdProdService    pdProdService;
    private final PdProdSkuService pdProdSkuService;

    /** getMyCart — 조회 */
    public List<OdCartDto.Item> getMyCart(OdCartDto.Request req) {
        if (req == null) req = new OdCartDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        List<OdCartDto.Item> list = odCartRepository.selectList(req);
        _listFillRelations(list);
        return list;
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

    /** addToCart — 추가 */
    @Transactional
    public OdCart addToCart(OdCart entity) {
        entity.setCartId(CmUtil.generateId("od_cart"));
        entity.setMemberId(SecurityUtil.getAuthUser().authId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdCart saved = odCartRepository.save(entity);
        if (saved == null) throw new CmBizException("장바구니 추가에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** updateQty — 수정 */
    @Transactional
    public OdCart updateQty(String cartId, int qty) {
        OdCart cart = odCartRepository.findById(cartId)
                .orElseThrow(() -> new CmBizException("장바구니 항목이 없습니다: " + cartId + "::" + CmUtil.svcCallerInfo(this)));
        if (!cart.getMemberId().equals(SecurityUtil.getAuthUser().authId()))
            throw new CmBizException("접근 권한이 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        cart.setOrderQty(qty);
        cart.setUpdBy(SecurityUtil.getAuthUser().authId());
        cart.setUpdDate(LocalDateTime.now());
        OdCart saved = odCartRepository.save(cart);
        if (saved == null) throw new CmBizException("수량 변경에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** removeFromCart — 삭제 */
    @Transactional
    public void removeFromCart(String cartId) {
        OdCart cart = odCartRepository.findById(cartId)
                .orElseThrow(() -> new CmBizException("장바구니 항목이 없습니다: " + cartId + "::" + CmUtil.svcCallerInfo(this)));
        if (!cart.getMemberId().equals(SecurityUtil.getAuthUser().authId()))
            throw new CmBizException("접근 권한이 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        odCartRepository.deleteById(cartId);
    }

}
