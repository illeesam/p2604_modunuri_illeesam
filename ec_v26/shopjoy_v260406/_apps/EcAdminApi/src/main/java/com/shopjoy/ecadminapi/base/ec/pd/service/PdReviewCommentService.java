package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewCommentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewComment;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdReviewCommentMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewCommentRepository;
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
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class PdReviewCommentService {


    private final PdReviewCommentMapper pdReviewCommentMapper;
    private final PdReviewCommentRepository pdReviewCommentRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdReviewCommentDto getById(String id) {
        // pd_review_comment :: select one :: id [orm:mybatis]
        PdReviewCommentDto result = pdReviewCommentMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdReviewCommentDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_review_comment :: select list :: p [orm:mybatis]
        List<PdReviewCommentDto> result = pdReviewCommentMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdReviewCommentDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_review_comment :: select page :: [orm:mybatis]
        return PageResult.of(pdReviewCommentMapper.selectPageList(p), pdReviewCommentMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdReviewComment entity) {
        // pd_review_comment :: update :: [orm:mybatis]
        int result = pdReviewCommentMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdReviewComment create(PdReviewComment entity) {
        entity.setReviewCommentId(CmUtil.generateId("pd_review_comment"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_review_comment :: insert or update :: [orm:jpa]
        PdReviewComment result = pdReviewCommentRepository.save(entity);
        return result;
    }

    @Transactional
    public PdReviewComment save(PdReviewComment entity) {
        if (!pdReviewCommentRepository.existsById(entity.getReviewCommentId()))
            throw new CmBizException("존재하지 않는 PdReviewComment입니다: " + entity.getReviewCommentId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_review_comment :: insert or update :: [orm:jpa]
        PdReviewComment result = pdReviewCommentRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!pdReviewCommentRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdReviewComment입니다: " + id);
        // pd_review_comment :: delete :: id [orm:jpa]
        pdReviewCommentRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<PdReviewComment> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdReviewComment row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setReviewCommentId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_review_comment"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdReviewCommentRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getReviewCommentId(), "reviewCommentId must not be null");
                PdReviewComment entity = pdReviewCommentRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "reviewCommentId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdReviewCommentRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getReviewCommentId(), "reviewCommentId must not be null");
                if (pdReviewCommentRepository.existsById(id)) pdReviewCommentRepository.deleteById(id);
            }
        }
    }
}