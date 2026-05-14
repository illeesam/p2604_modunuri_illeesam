package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCacheRepository;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * FO 캐쉬(충전금) 서비스 — 현재 회원의 잔액 조회
 * URL: /api/fo/ec/pm/cache
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoPmCacheService {

    private final PmCacheRepository pmCacheRepository;

    /** 현재 회원의 최신 잔액 (balance_amt 기준) */
    public long getBalance(PmCacheDto.Request req) {
        if (req == null) req = new PmCacheDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        List<PmCacheDto.Item> list = pmCacheRepository.selectList(req);
        return list.isEmpty() ? 0L : (list.get(0).getBalanceAmt() != null ? list.get(0).getBalanceAmt() : 0L);
    }
}
