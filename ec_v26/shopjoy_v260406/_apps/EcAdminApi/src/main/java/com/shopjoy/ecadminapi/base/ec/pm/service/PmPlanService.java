package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmPlanMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmPlanRepository;
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
public class PmPlanService {

    private final PmPlanMapper pmPlanMapper;
    private final PmPlanRepository pmPlanRepository;

    @PersistenceContext
    private EntityManager em;

    public PmPlanDto.Item getById(String id) {
        PmPlanDto.Item dto = pmPlanMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmPlan findById(String id) {
        return pmPlanRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmPlanRepository.existsById(id);
    }

    public List<PmPlanDto.Item> getList(PmPlanDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmPlanMapper.selectList(req);
    }

    public PmPlanDto.PageResponse getPageData(PmPlanDto.Request req) {
        PageHelper.addPaging(req);
        PmPlanDto.PageResponse res = new PmPlanDto.PageResponse();
        List<PmPlanDto.Item> list = pmPlanMapper.selectPageList(req);
        long count = pmPlanMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmPlan create(PmPlan body) {
        body.setPlanId(CmUtil.generateId("pm_plan"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmPlan saved = pmPlanRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmPlan save(PmPlan entity) {
        if (!existsById(entity.getPlanId()))
            throw new CmBizException("존재하지 않는 PmPlan입니다: " + entity.getPlanId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmPlan saved = pmPlanRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmPlan update(String id, PmPlan body) {
        PmPlan entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "planId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmPlan saved = pmPlanRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmPlan updatePartial(PmPlan entity) {
        if (entity.getPlanId() == null) throw new CmBizException("planId 가 필요합니다.");
        if (!existsById(entity.getPlanId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPlanId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmPlanMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmPlan entity = findById(id);
        pmPlanRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PmPlan> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPlanId() != null)
            .map(PmPlan::getPlanId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmPlanRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmPlan> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPlanId() != null)
            .toList();
        for (PmPlan row : updateRows) {
            PmPlan entity = findById(row.getPlanId());
            VoUtil.voCopyExclude(row, entity, "planId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmPlanRepository.save(entity);
        }
        em.flush();

        List<PmPlan> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmPlan row : insertRows) {
            row.setPlanId(CmUtil.generateId("pm_plan"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmPlanRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
