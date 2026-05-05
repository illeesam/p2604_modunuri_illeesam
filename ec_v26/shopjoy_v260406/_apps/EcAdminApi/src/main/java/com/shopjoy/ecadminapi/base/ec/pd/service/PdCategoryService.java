package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdCategoryMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryRepository;
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
public class PdCategoryService {


    private final PdCategoryMapper pdCategoryMapper;
    private final PdCategoryRepository pdCategoryRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdCategoryDto getById(String id) {
        // pd_category :: select one :: id [orm:mybatis]
        PdCategoryDto result = pdCategoryMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdCategoryDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_category :: select list :: p [orm:mybatis]
        List<PdCategoryDto> result = pdCategoryMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdCategoryDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_category :: select page :: [orm:mybatis]
        return PageResult.of(pdCategoryMapper.selectPageList(p), pdCategoryMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdCategory entity) {
        // pd_category :: update :: [orm:mybatis]
        int result = pdCategoryMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdCategory create(PdCategory entity) {
        entity.setCategoryId(CmUtil.generateId("pd_category"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_category :: insert or update :: [orm:jpa]
        PdCategory result = pdCategoryRepository.save(entity);
        return result;
    }

    @Transactional
    public PdCategory save(PdCategory entity) {
        if (!pdCategoryRepository.existsById(entity.getCategoryId()))
            throw new CmBizException("존재하지 않는 PdCategory입니다: " + entity.getCategoryId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_category :: insert or update :: [orm:jpa]
        PdCategory result = pdCategoryRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!pdCategoryRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PdCategory입니다: " + id);
        // pd_category :: delete :: id [orm:jpa]
        pdCategoryRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<PdCategory> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PdCategory row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setCategoryId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pd_category"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdCategoryRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getCategoryId(), "categoryId must not be null");
                PdCategory entity = pdCategoryRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "categoryId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pdCategoryRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getCategoryId(), "categoryId must not be null");
                if (pdCategoryRepository.existsById(id)) pdCategoryRepository.deleteById(id);
            }
        }
    }
}