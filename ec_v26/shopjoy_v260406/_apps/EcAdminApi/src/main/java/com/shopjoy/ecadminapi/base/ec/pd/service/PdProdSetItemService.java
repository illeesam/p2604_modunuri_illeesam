package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSetItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSetItem;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdSetItemMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdSetItemRepository;
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
public class PdProdSetItemService {

    private final PdProdSetItemMapper mapper;
    private final PdProdSetItemRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdProdSetItemDto getById(String id) {
        // pd_prod_set_item :: select one :: id [orm:mybatis]
        PdProdSetItemDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdProdSetItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pd_prod_set_item :: select list :: p [orm:mybatis]
        List<PdProdSetItemDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdProdSetItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pd_prod_set_item :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdProdSetItem entity) {
        // pd_prod_set_item :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PdProdSetItem create(PdProdSetItem entity) {
        entity.setSetItemId(CmUtil.generateId("pd_prod_set_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // pd_prod_set_item :: insert or update :: [orm:jpa]
        PdProdSetItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public PdProdSetItem save(PdProdSetItem entity) {
        if (!repository.existsById(entity.getSetItemId()))
            throw new CmBizException("존재하지 않는 PdProdSetItem입니다: " + entity.getSetItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pd_prod_set_item :: insert or update :: [orm:jpa]
        PdProdSetItem result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PdProdSetItem입니다: " + id);
        // pd_prod_set_item :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }
}
