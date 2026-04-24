package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdChgHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdhProdChgHistService {

    private final PdhProdChgHistMapper mapper;
    private final PdhProdChgHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdhProdChgHistDto getById(String id) {
        // pdh_prod_chg_hist :: select one :: id [orm:mybatis]
        PdhProdChgHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdhProdChgHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pdh_prod_chg_hist :: select list :: p [orm:mybatis]
        List<PdhProdChgHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdhProdChgHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pdh_prod_chg_hist :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdhProdChgHist entity) {
        // pdh_prod_chg_hist :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

}
