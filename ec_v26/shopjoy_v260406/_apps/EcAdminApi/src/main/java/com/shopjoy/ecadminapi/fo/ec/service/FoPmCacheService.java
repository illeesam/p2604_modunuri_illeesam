package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCacheMapper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

/**
 * FO 캐쉬(충전금) 서비스 — 현재 회원의 잔액 조회
 * URL: /api/fo/ec/pm/cache
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoPmCacheService {

    private final PmCacheMapper pmCacheMapper;

    /** 현재 회원의 최신 잔액 (balance_amt 기준) */
    public long getBalance(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().authId());
        List<PmCacheDto> list = pmCacheMapper.selectList(p);
        return list.isEmpty() ? 0L : (list.get(0).getBalanceAmt() != null ? list.get(0).getBalanceAmt() : 0L);
    }
}
