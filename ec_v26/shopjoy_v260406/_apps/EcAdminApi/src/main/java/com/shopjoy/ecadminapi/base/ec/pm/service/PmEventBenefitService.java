package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmEventBenefitMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventBenefitRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class PmEventBenefitService {


    private final PmEventBenefitMapper pmEventBenefitMapper;
    private final PmEventBenefitRepository pmEventBenefitRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmEventBenefitDto getById(String id) {
        // pm_event_benefit :: select one :: id [orm:mybatis]
        PmEventBenefitDto result = pmEventBenefitMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmEventBenefitDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_event_benefit :: select list :: p [orm:mybatis]
        List<PmEventBenefitDto> result = pmEventBenefitMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmEventBenefitDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_event_benefit :: select page :: [orm:mybatis]
        return PageResult.of(pmEventBenefitMapper.selectPageList(p), pmEventBenefitMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmEventBenefit entity) {
        // pm_event_benefit :: update :: [orm:mybatis]
        int result = pmEventBenefitMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmEventBenefit create(PmEventBenefit entity) {
        entity.setBenefitId(CmUtil.generateId("pm_event_benefit"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_event_benefit :: insert or update :: [orm:jpa]
        PmEventBenefit result = pmEventBenefitRepository.save(entity);
        return result;
    }

    @Transactional
    public PmEventBenefit save(PmEventBenefit entity) {
        if (!pmEventBenefitRepository.existsById(entity.getBenefitId()))
            throw new CmBizException("존재하지 않는 PmEventBenefit입니다: " + entity.getBenefitId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_event_benefit :: insert or update :: [orm:jpa]
        PmEventBenefit result = pmEventBenefitRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!pmEventBenefitRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmEventBenefit입니다: " + id);
        // pm_event_benefit :: delete :: id [orm:jpa]
        pmEventBenefitRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<PmEventBenefit> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmEventBenefit row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setBenefitId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_event_benefit"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmEventBenefitRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getBenefitId(), "benefitId must not be null");
                PmEventBenefit entity = pmEventBenefitRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "benefitId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmEventBenefitRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getBenefitId(), "benefitId must not be null");
                if (pmEventBenefitRepository.existsById(id)) pmEventBenefitRepository.deleteById(id);
            }
        }
    }
}