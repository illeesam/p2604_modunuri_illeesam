package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmEventBenefitMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventBenefitRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class PmEventBenefitService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PmEventBenefitMapper mapper;
    private final PmEventBenefitRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmEventBenefitDto getById(String id) {
        // pm_event_benefit :: select one :: id [orm:mybatis]
        PmEventBenefitDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmEventBenefitDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_event_benefit :: select list :: p [orm:mybatis]
        List<PmEventBenefitDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmEventBenefitDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_event_benefit :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmEventBenefit entity) {
        // pm_event_benefit :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmEventBenefit create(PmEventBenefit entity) {
        entity.setBenefitId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        // pm_event_benefit :: insert or update :: [orm:jpa]
        PmEventBenefit result = repository.save(entity);
        return result;
    }

    @Transactional
    public PmEventBenefit save(PmEventBenefit entity) {
        if (!repository.existsById(entity.getBenefitId()))
            throw new CmBizException("존재하지 않는 PmEventBenefit입니다: " + entity.getBenefitId());
        entity.setUpdBy(SecurityUtil.getAuthUser().userId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_event_benefit :: insert or update :: [orm:jpa]
        PmEventBenefit result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PmEventBenefit입니다: " + id);
        // pm_event_benefit :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=EVB (pm_event_benefit) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "EVB" + ts + rand;
    }
}
