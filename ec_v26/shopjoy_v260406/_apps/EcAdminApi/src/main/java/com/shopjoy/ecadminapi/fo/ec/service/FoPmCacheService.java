package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCacheMapper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * FO 캐쉬(충전금) 서비스 — 현재 회원의 잔액 조회
 * URL: /api/fo/ec/pm/cache
 */
@Service
@RequiredArgsConstructor
public class FoPmCacheService {

    private final PmCacheMapper mapper;

    /** 현재 회원의 최신 잔액 (balance_amt 기준) */
    @Transactional(readOnly = true)
    public long getBalance(String siteId) {
        String memberId = SecurityUtil.currentUserId();
        List<PmCacheDto> list = mapper.selectList(Map.of(
            "memberId", memberId,
            "siteId",   siteId != null ? siteId : "",
            "sort",     "reg_desc",
            "limit",    1,
            "offset",   0
        ));
        return list.isEmpty() ? 0L : (list.get(0).getBalanceAmt() != null ? list.get(0).getBalanceAmt() : 0L);
    }
}
