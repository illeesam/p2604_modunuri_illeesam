package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmPlanMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmPlanRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoPmPlanService {
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");
    private final PmPlanMapper pmPlanMapper;
    private final PmPlanRepository pmPlanRepository;
    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public List<PmPlanDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return pmPlanMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PmPlanDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pmPlanMapper.selectPageList(p), pmPlanMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public PmPlanDto getById(String id) {
        PmPlanDto dto = pmPlanMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public PmPlan create(PmPlan body) {
        body.setPlanId("PL" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmPlan saved = pmPlanRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        return saved;
    }

    @Transactional
    public PmPlanDto update(String id, PmPlan body) {
        PmPlan entity = pmPlanRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        VoUtil.voCopyExclude(body, entity, "planId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmPlan saved = pmPlanRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }

    @Transactional
    public void delete(String id) {
        PmPlan entity = pmPlanRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        pmPlanRepository.delete(entity);
        em.flush();
        if (pmPlanRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public PmPlanDto changeStatus(String id, String statusCd) {
        PmPlan entity = pmPlanRepository.findById(id).orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setPlanStatusCdBefore(entity.getPlanStatusCd());
        entity.setPlanStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmPlan saved = pmPlanRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return getById(id);
    }
    @Transactional
    public void saveList(List<PmPlan> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄 처리
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPlanId() != null)
            .map(PmPlan::getPlanId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmPlanRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        // 2단계: UPDATE 처리
        for (PmPlan row : rows) {
            if (!"U".equals(row.getRowStatus())) continue;
            String id = Objects.requireNonNull(row.getPlanId(), "planId must not be null");
            PmPlan entity = pmPlanRepository.findById(id)
                .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
            VoUtil.voCopyExclude(row, entity, "planId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmPlanRepository.save(entity);
        }
        em.flush();

        // 3단계: INSERT 처리
        for (PmPlan row : rows) {
            if (!"I".equals(row.getRowStatus())) continue;
            row.setPlanId("PL" + now.format(ID_FMT) + String.format("%04d", (int)(Math.random()*10000)));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmPlanRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
