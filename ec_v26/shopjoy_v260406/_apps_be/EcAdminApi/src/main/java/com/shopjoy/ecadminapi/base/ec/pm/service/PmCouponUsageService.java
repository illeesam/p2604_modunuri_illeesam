package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PmCouponUsageService {

    private final PmCouponUsageRepository pmCouponUsageRepository;

    @PersistenceContext
    private EntityManager em;

    public PmCouponUsageDto.Item getById(String id) {
        PmCouponUsageDto.Item dto = pmCouponUsageRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCouponUsageDto.Item getByIdOrNull(String id) {
        return pmCouponUsageRepository.selectById(id).orElse(null);
    }

    public PmCouponUsage findById(String id) {
        return pmCouponUsageRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCouponUsage findByIdOrNull(String id) {
        return pmCouponUsageRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pmCouponUsageRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmCouponUsageRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PmCouponUsageDto.Item> getList(PmCouponUsageDto.Request req) {
        return pmCouponUsageRepository.selectList(req);
    }

    public PmCouponUsageDto.PageResponse getPageData(PmCouponUsageDto.Request req) {
        PageHelper.addPaging(req);
        return pmCouponUsageRepository.selectPageList(req);
    }

    @Transactional
    public PmCouponUsage create(PmCouponUsage body) {
        body.setUsageId(CmUtil.generateId("pm_coupon_usage"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmCouponUsage saved = pmCouponUsageRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmCouponUsage save(PmCouponUsage entity) {
        if (!existsById(entity.getUsageId()))
            throw new CmBizException("존재하지 않는 PmCouponUsage입니다: " + entity.getUsageId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponUsage saved = pmCouponUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmCouponUsage update(String id, PmCouponUsage body) {
        PmCouponUsage entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "usageId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponUsage saved = pmCouponUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmCouponUsage updateSelective(PmCouponUsage entity) {
        if (entity.getUsageId() == null) throw new CmBizException("usageId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getUsageId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getUsageId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmCouponUsageRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmCouponUsage entity = findById(id);
        pmCouponUsageRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PmCouponUsage> rows) {
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
        List<PmCouponUsage> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getUsageId() != null)
            .toList();
        for (PmCouponUsage row : updateRows) {
            PmCouponUsage entity = findById(row.getUsageId());
            VoUtil.voCopyExclude(row, entity, "usageId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmCouponUsageRepository.save(entity);
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
        }
        em.flush();
        em.clear();
    }
}
