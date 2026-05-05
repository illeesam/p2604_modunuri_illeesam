package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewAttachDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewAttach;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdReviewAttachMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewAttachRepository;
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
public class PdReviewAttachService {


    private final PdReviewAttachMapper pdReviewAttachMapper;
    private final PdReviewAttachRepository pdReviewAttachRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdReviewAttachDto getById(String id) {
        // pd_review_attach :: select one :: id [orm:mybatis]
        PdReviewAttachDto result = pdReviewAttachMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdReviewAttachDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_review_attach :: select list :: p [orm:mybatis]
        List<PdReviewAttachDto> result = pdReviewAttachMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdReviewAttachDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_review_attach :: select page :: [orm:mybatis]
        return PageResult.of(pdReviewAttachMapper.selectPageList(p), pdReviewAttachMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdReviewAttach entity) {
        // pd_review_attach :: update :: [orm:mybatis]
        int result = pdReviewAttachMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdReviewAttach create(PdReviewAttach entity) {
        entity.setReviewAttachId(CmUtil.generateId("pd_review_attach"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_review_attach :: insert or update :: [orm:jpa]
        PdReviewAttach result = pdReviewAttachRepository.save(entity);
        return result;
    }

    @Transactional
    public PdReviewAttach save(PdReviewAttach entity) {
        if (!pdReviewAttachRepository.existsById(entity.getReviewAttachId()))
            throw new CmBizException("존재하지 않는 PdReviewAttach입니다: " + entity.getReviewAttachId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_review_attach :: insert or update :: [orm:jpa]
        PdReviewAttach result = pdReviewAttachRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!pdReviewAttachRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdReviewAttach입니다: " + id);
        // pd_review_attach :: delete :: id [orm:jpa]
        pdReviewAttachRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<PdReviewAttach> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdReviewAttach row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setReviewAttachId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_review_attach"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdReviewAttachRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getReviewAttachId(), "reviewAttachId must not be null");
                PdReviewAttach entity = pdReviewAttachRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "reviewAttachId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdReviewAttachRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getReviewAttachId(), "reviewAttachId must not be null");
                if (pdReviewAttachRepository.existsById(id)) pdReviewAttachRepository.deleteById(id);
            }
        }
    }
}