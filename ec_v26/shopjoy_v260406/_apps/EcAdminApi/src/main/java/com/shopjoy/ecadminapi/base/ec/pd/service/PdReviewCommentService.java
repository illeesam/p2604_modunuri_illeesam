package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdReviewCommentMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewCommentRepository;
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
public class PdReviewCommentService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PdReviewCommentMapper mapper;
    private final PdReviewCommentRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdReviewCommentDto getById(String id) {
        // pd_review_comment :: select one :: id [orm:mybatis]
        PdReviewCommentDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdReviewCommentDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_review_comment :: select list :: p [orm:mybatis]
        List<PdReviewCommentDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdReviewCommentDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_review_comment :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdReviewComment entity) {
        // pd_review_comment :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdReviewComment create(PdReviewComment entity) {
        entity.setReviewCommentId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // pd_review_comment :: insert or update :: [orm:jpa]
        PdReviewComment result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdReviewComment save(PdReviewComment entity) {
        if (!repository.existsById(entity.getReviewCommentId()))
            throw new CmBizException("존재하지 않는 PdReviewComment입니다: " + entity.getReviewCommentId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_review_comment :: insert or update :: [orm:jpa]
        PdReviewComment result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdReviewComment입니다: " + id);
        // pd_review_comment :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=REC (pd_review_comment) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "REC" + ts + rand;
    }
}
