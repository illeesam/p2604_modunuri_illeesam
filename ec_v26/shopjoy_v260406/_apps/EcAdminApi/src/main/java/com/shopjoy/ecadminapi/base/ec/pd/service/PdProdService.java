package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRepository;
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
public class PdProdService {

    private final PdProdMapper mapper;
    private final PdProdRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdDto getById(String id) {
        // pd_prod :: select one :: id [orm:mybatis]
        PdProdDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod :: select list :: p [orm:mybatis]
        List<PdProdDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProd entity) {
        // pd_prod :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProd create(PdProd entity) {
        entity.setProdId(CmUtil.generateId("pd_prod"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // pd_prod :: insert or update :: [orm:jpa]
        PdProd result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdProd save(PdProd entity) {
        if (!repository.existsById(entity.getProdId()))
            throw new CmBizException("존재하지 않는 PdProd입니다: " + entity.getProdId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod :: insert or update :: [orm:jpa]
        PdProd result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProd입니다: " + id);
        // pd_prod :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }
}
