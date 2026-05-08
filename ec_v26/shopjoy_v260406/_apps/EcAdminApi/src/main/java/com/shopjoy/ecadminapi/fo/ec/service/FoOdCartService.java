package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdCart;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdCartMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdCartRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

/**
 * FO 장바구니 서비스 — 현재 로그인 회원의 장바구니 관리
 * URL: /api/fo/ec/od/cart
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoOdCartService {


    private final OdCartMapper     odCartMapper;
    private final OdCartRepository odCartRepository;

    /** getMyCart — 조회 */
    public List<OdCartDto> getMyCart(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().authId());
        return odCartMapper.selectList(p);
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
        if (saved == null) throw new CmBizException("장바구니 추가에 실패했습니다.");
        return saved;
    }

    /** updateQty — 수정 */
    @Transactional
    public OdCart updateQty(String cartId, int qty) {
        OdCart cart = odCartRepository.findById(cartId)
                .orElseThrow(() -> new CmBizException("장바구니 항목이 없습니다: " + cartId));
        if (!cart.getMemberId().equals(SecurityUtil.getAuthUser().authId()))
            throw new CmBizException("접근 권한이 없습니다.");
        cart.setOrderQty(qty);
        cart.setUpdBy(SecurityUtil.getAuthUser().authId());
        cart.setUpdDate(LocalDateTime.now());
        OdCart saved = odCartRepository.save(cart);
        if (saved == null) throw new CmBizException("수량 변경에 실패했습니다.");
        return saved;
    }

    /** removeFromCart — 삭제 */
    @Transactional
    public void removeFromCart(String cartId) {
        OdCart cart = odCartRepository.findById(cartId)
                .orElseThrow(() -> new CmBizException("장바구니 항목이 없습니다: " + cartId));
        if (!cart.getMemberId().equals(SecurityUtil.getAuthUser().authId()))
            throw new CmBizException("접근 권한이 없습니다.");
        odCartRepository.deleteById(cartId);
    }

}
