package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PmCouponService {

    private final PmCouponRepository pmCouponRepository;

    @PersistenceContext
    private EntityManager em;

    /* 쿠폰 키조회 */
    public PmCouponDto.Item getById(String id) {
        PmCouponDto.Item dto = pmCouponRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCouponDto.Item getByIdOrNull(String id) {
        return pmCouponRepository.selectById(id).orElse(null);
    }

    /* 쿠폰 상세조회 */
    public PmCoupon findById(String id) {
        return pmCouponRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCoupon findByIdOrNull(String id) {
        return pmCouponRepository.findById(id).orElse(null);
    }

    /* 쿠폰 키검증 */
    public boolean existsById(String id) {
        return pmCouponRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmCouponRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 쿠폰 목록조회 */
    public List<PmCouponDto.Item> getList(PmCouponDto.Request req) {
        return pmCouponRepository.selectList(req);
    }

    /* 쿠폰 페이지조회 */
    public PmCouponDto.PageResponse getPageData(PmCouponDto.Request req) {
        PageHelper.addPaging(req);
        return pmCouponRepository.selectPageList(req);
    }

    /* 쿠폰 등록 */
    @Transactional
    public PmCoupon create(PmCoupon body) {
        body.setCouponId(CmUtil.generateId("pm_coupon"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmCoupon saved = pmCouponRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 쿠폰 저장 */
    @Transactional
    public PmCoupon save(PmCoupon entity) {
        if (!existsById(entity.getCouponId()))
            throw new CmBizException("존재하지 않는 PmCoupon입니다: " + entity.getCouponId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCoupon saved = pmCouponRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 쿠폰 수정 */
    @Transactional
    public PmCoupon update(String id, PmCoupon body) {
        PmCoupon entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "couponId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCoupon saved = pmCouponRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 쿠폰 수정 */
    @Transactional
    public PmCoupon updateSelective(PmCoupon entity) {
        if (entity.getCouponId() == null) throw new CmBizException("couponId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCouponId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCouponId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmCouponRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 쿠폰 삭제 */
    @Transactional
    public void delete(String id) {
        PmCoupon entity = findById(id);
        pmCouponRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 쿠폰 목록저장 */
    @Transactional
    public void saveList(List<PmCoupon> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCouponId() != null)
            .map(PmCoupon::getCouponId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmCouponRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmCoupon> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getCouponId() != null)
            .toList();
        for (PmCoupon row : updateRows) {
            PmCoupon entity = findById(row.getCouponId());
            VoUtil.voCopyExclude(row, entity, "couponId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmCouponRepository.save(entity);
        }
        em.flush();

        List<PmCoupon> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmCoupon row : insertRows) {
            row.setCouponId(CmUtil.generateId("pm_coupon"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmCouponRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
