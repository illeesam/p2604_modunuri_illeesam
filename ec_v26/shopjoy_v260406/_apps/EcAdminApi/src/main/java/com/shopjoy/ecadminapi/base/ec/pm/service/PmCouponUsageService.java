package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponUsageMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponUsageRepository;
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
public class PmCouponUsageService {

    private final PmCouponUsageMapper pmCouponUsageMapper;
    private final PmCouponUsageRepository pmCouponUsageRepository;

    @PersistenceContext
    private EntityManager em;

    public PmCouponUsageDto.Item getById(String id) {
        PmCouponUsageDto.Item dto = pmCouponUsageMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmCouponUsage findById(String id) {
        return pmCouponUsageRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmCouponUsageRepository.existsById(id);
    }

    public List<PmCouponUsageDto.Item> getList(PmCouponUsageDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmCouponUsageMapper.selectList(req);
    }

    public PmCouponUsageDto.PageResponse getPageData(PmCouponUsageDto.Request req) {
        PageHelper.addPaging(req);
        PmCouponUsageDto.PageResponse res = new PmCouponUsageDto.PageResponse();
        List<PmCouponUsageDto.Item> list = pmCouponUsageMapper.selectPageList(req);
        long count = pmCouponUsageMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmCouponUsage create(PmCouponUsage body) {
        body.setUsageId(CmUtil.generateId("pm_coupon_usage"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmCouponUsage saved = pmCouponUsageRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getUsageId());
    }

    @Transactional
    public PmCouponUsage save(PmCouponUsage entity) {
        if (!existsById(entity.getUsageId()))
            throw new CmBizException("존재하지 않는 PmCouponUsage입니다: " + entity.getUsageId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponUsage saved = pmCouponUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getUsageId());
    }

    @Transactional
    public PmCouponUsage update(String id, PmCouponUsage body) {
        PmCouponUsage entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "usageId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponUsage saved = pmCouponUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PmCouponUsage updatePartial(PmCouponUsage entity) {
        if (entity.getUsageId() == null) throw new CmBizException("usageId 가 필요합니다.");
        if (!existsById(entity.getUsageId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getUsageId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmCouponUsageMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getUsageId());
    }

    @Transactional
    public void delete(String id) {
        PmCouponUsage entity = findById(id);
        pmCouponUsageRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PmCouponUsage> saveList(List<PmCouponUsage> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getUsageId() != null)
            .map(PmCouponUsage::getUsageId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmCouponUsageRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PmCouponUsage> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getUsageId() != null)
            .toList();
        for (PmCouponUsage row : updateRows) {
            PmCouponUsage entity = findById(row.getUsageId());
            VoUtil.voCopyExclude(row, entity, "usageId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmCouponUsageRepository.save(entity);
            upsertedIds.add(entity.getUsageId());
        }
        em.flush();

        List<PmCouponUsage> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmCouponUsage row : insertRows) {
            row.setUsageId(CmUtil.generateId("pm_coupon_usage"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmCouponUsageRepository.save(row);
            upsertedIds.add(row.getUsageId());
        }
        em.flush();
        em.clear();

        List<PmCouponUsage> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
