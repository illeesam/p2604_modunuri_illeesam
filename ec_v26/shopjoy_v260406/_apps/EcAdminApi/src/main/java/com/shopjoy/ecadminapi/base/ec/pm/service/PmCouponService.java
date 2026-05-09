package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponMapper;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PmCouponService {

    private final PmCouponMapper pmCouponMapper;
    private final PmCouponRepository pmCouponRepository;

    @PersistenceContext
    private EntityManager em;

    public PmCouponDto.Item getById(String id) {
        PmCouponDto.Item dto = pmCouponMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmCoupon findById(String id) {
        return pmCouponRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmCouponRepository.existsById(id);
    }

    public List<PmCouponDto.Item> getList(PmCouponDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmCouponMapper.selectList(req);
    }

    public PmCouponDto.PageResponse getPageData(PmCouponDto.Request req) {
        PageHelper.addPaging(req);
        PmCouponDto.PageResponse res = new PmCouponDto.PageResponse();
        List<PmCouponDto.Item> list = pmCouponMapper.selectPageList(req);
        long count = pmCouponMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmCoupon create(PmCoupon body) {
        body.setCouponId(CmUtil.generateId("pm_coupon"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmCoupon saved = pmCouponRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmCoupon save(PmCoupon entity) {
        if (!existsById(entity.getCouponId()))
            throw new CmBizException("존재하지 않는 PmCoupon입니다: " + entity.getCouponId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCoupon saved = pmCouponRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmCoupon update(String id, PmCoupon body) {
        PmCoupon entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "couponId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCoupon saved = pmCouponRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmCoupon updatePartial(PmCoupon entity) {
        if (entity.getCouponId() == null) throw new CmBizException("couponId 가 필요합니다.");
        if (!existsById(entity.getCouponId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCouponId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmCouponMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmCoupon entity = findById(id);
        pmCouponRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

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
