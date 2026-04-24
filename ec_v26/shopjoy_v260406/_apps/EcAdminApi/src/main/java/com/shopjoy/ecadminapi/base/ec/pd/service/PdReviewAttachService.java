package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewAttachDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewAttach;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdReviewAttachMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewAttachRepository;
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
public class PdReviewAttachService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PdReviewAttachMapper mapper;
    private final PdReviewAttachRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdReviewAttachDto getById(String id) {
        // pd_review_attach :: select one :: id [orm:mybatis]
        PdReviewAttachDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdReviewAttachDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_review_attach :: select list :: p [orm:mybatis]
        List<PdReviewAttachDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdReviewAttachDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_review_attach :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdReviewAttach entity) {
        // pd_review_attach :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdReviewAttach create(PdReviewAttach entity) {
        entity.setReviewAttachId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        // pd_review_attach :: insert or update :: [orm:jpa]
        PdReviewAttach result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdReviewAttach save(PdReviewAttach entity) {
        if (!repository.existsById(entity.getReviewAttachId()))
            throw new CmBizException("존재하지 않는 PdReviewAttach입니다: " + entity.getReviewAttachId());
        entity.setUpdBy(SecurityUtil.getAuthUser().userId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_review_attach :: insert or update :: [orm:jpa]
        PdReviewAttach result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdReviewAttach입니다: " + id);
        // pd_review_attach :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=REA (pd_review_attach) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "REA" + ts + rand;
    }
}
