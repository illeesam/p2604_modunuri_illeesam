package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdTagMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdTagRepository;
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
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class PdProdTagService {

    private final PdProdTagMapper mapper;
    private final PdProdTagRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdTagDto getById(String id) {
        // pd_prod_tag :: select one :: id [orm:mybatis]
        PdProdTagDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdTagDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_tag :: select list :: p [orm:mybatis]
        List<PdProdTagDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdTagDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_tag :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdTag entity) {
        // pd_prod_tag :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdTag create(PdProdTag entity) {
        entity.setProdTagId(CmUtil.generateId("pd_prod_tag"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_tag :: insert or update :: [orm:jpa]
        PdProdTag result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdProdTag save(PdProdTag entity) {
        if (!repository.existsById(entity.getProdTagId()))
            throw new CmBizException("존재하지 않는 PdProdTag입니다: " + entity.getProdTagId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_tag :: insert or update :: [orm:jpa]
        PdProdTag result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdTag입니다: " + id);
        // pd_prod_tag :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }
}
