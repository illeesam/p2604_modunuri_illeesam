package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdCategoryProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategoryProd;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdCategoryProdMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdCategoryProdRepository;
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
public class PdCategoryProdService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final PdCategoryProdMapper mapper;
    private final PdCategoryProdRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdCategoryProdDto getById(String id) {
        // pd_category_prod :: select one :: id [orm:mybatis]
        PdCategoryProdDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdCategoryProdDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_category_prod :: select list :: p [orm:mybatis]
        List<PdCategoryProdDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdCategoryProdDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_category_prod :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdCategoryProd entity) {
        // pd_category_prod :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdCategoryProd create(PdCategoryProd entity) {
        entity.setCategoryProdId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // pd_category_prod :: insert or update :: [orm:jpa]
        PdCategoryProd result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdCategoryProd save(PdCategoryProd entity) {
        if (!repository.existsById(entity.getCategoryProdId()))
            throw new CmBizException("존재하지 않는 PdCategoryProd입니다: " + entity.getCategoryProdId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_category_prod :: insert or update :: [orm:jpa]
        PdCategoryProd result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdCategoryProd입니다: " + id);
        // pd_category_prod :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=CAP (pd_category_prod) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "CAP" + ts + rand;
    }
}
