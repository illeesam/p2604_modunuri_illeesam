package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponRepository;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCouponService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * BO 쿠폰 서비스 — base PmCouponService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPmCouponService {

    private final PmCouponService pmCouponService;
    private final PmCouponRepository pmCouponRepository;

    @PersistenceContext
    private EntityManager em;

    public PmCouponDto.Item getById(String id) { return pmCouponService.getById(id); }
    public List<PmCouponDto.Item> getList(PmCouponDto.Request req) { return pmCouponService.getList(req); }
    public PmCouponDto.PageResponse getPageData(PmCouponDto.Request req) { return pmCouponService.getPageData(req); }

    @Transactional public PmCoupon create(PmCoupon body) { return pmCouponService.create(body); }
    @Transactional public PmCoupon update(String id, PmCoupon body) { return pmCouponService.update(id, body); }
    @Transactional public void delete(String id) { pmCouponService.delete(id); }
    @Transactional public List<PmCoupon> saveList(List<PmCoupon> rows) { return pmCouponService.saveList(rows); }

    /** changeStatus — couponStatusCd 변경 (이력 보존) */
    @Transactional
    public PmCouponDto.Item changeStatus(String id, String statusCd) {
        PmCoupon entity = pmCouponRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setCouponStatusCdBefore(entity.getCouponStatusCd());
        entity.setCouponStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCoupon saved = pmCouponRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return pmCouponService.getById(id);
    }
}
