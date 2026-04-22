package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdCartMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdCartRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

/**
 * FO 장바구니 서비스 — 현재 로그인 회원의 장바구니 관리
 * URL: /api/fo/ec/od/cart
 */
@Service
@RequiredArgsConstructor
public class FoOdCartService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final OdCartMapper     mapper;
    private final OdCartRepository repository;

    @Transactional(readOnly = true)
    public List<OdCartDto> getMyCart(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().userId());
        return mapper.selectList(p);
    }

    @Transactional
    public OdCart addToCart(OdCart entity) {
        entity.setCartId(generateId());
        entity.setMemberId(SecurityUtil.getAuthUser().userId());
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public OdCart updateQty(String cartId, int qty) {
        OdCart cart = repository.findById(cartId)
                .orElseThrow(() -> new CmBizException("장바구니 항목이 없습니다: " + cartId));
        if (!cart.getMemberId().equals(SecurityUtil.getAuthUser().userId()))
            throw new CmBizException("접근 권한이 없습니다.");
        cart.setOrderQty(qty);
        cart.setUpdBy(SecurityUtil.getAuthUser().userId());
        cart.setUpdDate(LocalDateTime.now());
        return repository.save(cart);
    }

    @Transactional
    public void removeFromCart(String cartId) {
        OdCart cart = repository.findById(cartId)
                .orElseThrow(() -> new CmBizException("장바구니 항목이 없습니다: " + cartId));
        if (!cart.getMemberId().equals(SecurityUtil.getAuthUser().userId()))
            throw new CmBizException("접근 권한이 없습니다.");
        repository.deleteById(cartId);
    }

    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int) (Math.random() * 10000));
        return "CT" + ts + rand;
    }
}
