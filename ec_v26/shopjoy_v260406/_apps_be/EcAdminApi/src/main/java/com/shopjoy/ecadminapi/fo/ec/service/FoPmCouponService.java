package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponIssueRepository;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponService;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * FO 쿠폰 서비스 — 현재 회원의 사용 가능 쿠폰 조회
 * URL: /api/fo/ec/pm/coupon
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoPmCouponService {

    private final PmCouponIssueRepository pmCouponIssueRepository;
    private final PmCouponService         pmCouponService;

    /** getAvailableCoupons — 조회 */
    public List<PmCouponIssueDto.Item> getAvailableCoupons(PmCouponIssueDto.Request req) {
        if (req == null) req = new PmCouponIssueDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        req.setUseYn("N");
        List<PmCouponIssueDto.Item> list = pmCouponIssueRepository.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (coupon 마스터 단건을 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하지 않고, N개 행이라도 coupon 1회만 조회한다.
     */
    private void _listFillRelations(List<PmCouponIssueDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> couponIds = list.stream()
            .map(PmCouponIssueDto.Item::getCouponId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (couponIds.isEmpty()) return;

        // 상위 쿠폰 마스터 단건 조회 (couponId 기준)
        PmCouponDto.Request cReq = new PmCouponDto.Request();
        cReq.setCouponIds(couponIds);
        Map<String, PmCouponDto.Item> couponMap = pmCouponService.getList(cReq).stream()
            .collect(Collectors.toMap(PmCouponDto.Item::getCouponId, x -> x, (a, b) -> a));

        // 각 항목에 분배
        for (PmCouponIssueDto.Item issue : list) {
            issue.setCoupon(couponMap.get(issue.getCouponId())); // 쿠폰단건
        }
    }
}
