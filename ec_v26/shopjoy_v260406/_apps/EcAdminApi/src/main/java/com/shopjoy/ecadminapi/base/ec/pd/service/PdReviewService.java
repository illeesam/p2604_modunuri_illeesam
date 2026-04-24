package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReview;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdReviewMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class PdReviewService {


    private final PdReviewMapper mapper;
    private final PdReviewRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdReviewDto getById(String id) {
        // pd_review :: select one :: id [orm:mybatis]
        PdReviewDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdReviewDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_review :: select list :: p [orm:mybatis]
        List<PdReviewDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdReviewDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_review :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdReview entity) {
        // pd_review :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdReview create(PdReview entity) {
        entity.setReviewId(CmUtil.generateId("pd_review"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // pd_review :: insert or update :: [orm:jpa]
        PdReview result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdReview save(PdReview entity) {
        if (!repository.existsById(entity.getReviewId()))
            throw new CmBizException("존재하지 않는 PdReview입니다: " + entity.getReviewId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_review :: insert or update :: [orm:jpa]
        PdReview result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdReview입니다: " + id);
        // pd_review :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
