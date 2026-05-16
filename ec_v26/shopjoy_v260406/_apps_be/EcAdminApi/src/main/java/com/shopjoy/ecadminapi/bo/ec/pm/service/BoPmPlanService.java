package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmPlanDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmPlanRepository;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmPlanService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * BO 기획전 서비스 — base PmPlanService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPmPlanService {

    private final PmPlanService pmPlanService;
    private final PmPlanRepository pmPlanRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public PmPlanDto.Item getById(String id) { return pmPlanService.getById(id); }
    /* 목록조회 */
    public List<PmPlanDto.Item> getList(PmPlanDto.Request req) { return pmPlanService.getList(req); }
    /* 페이지조회 */
    public PmPlanDto.PageResponse getPageData(PmPlanDto.Request req) { return pmPlanService.getPageData(req); }

    @Transactional public PmPlan create(PmPlan body) { return pmPlanService.create(body); }
    @Transactional public PmPlan update(String id, PmPlan body) { return pmPlanService.update(id, body); }
    @Transactional public void delete(String id) { pmPlanService.delete(id); }
    @Transactional public void saveList(List<PmPlan> rows) { pmPlanService.saveList(rows); }

    /** changeStatus — planStatusCd 변경 (이력 보존) */
    @Transactional
    public PmPlanDto.Item changeStatus(String id, String statusCd) {
        PmPlan entity = pmPlanRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setPlanStatusCdBefore(entity.getPlanStatusCd());
        entity.setPlanStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmPlan saved = pmPlanRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return pmPlanService.getById(id);
    }
}
