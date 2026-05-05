package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdSkuChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdSkuChgHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdhProdSkuChgHistService {

    private final PdhProdSkuChgHistMapper pdhProdSkuChgHistMapper;
    private final PdhProdSkuChgHistRepository pdhProdSkuChgHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdhProdSkuChgHistDto getById(String id) {
        // pdh_prod_sku_chg_hist :: select one :: id [orm:mybatis]
        PdhProdSkuChgHistDto result = pdhProdSkuChgHistMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdhProdSkuChgHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pdh_prod_sku_chg_hist :: select list :: p [orm:mybatis]
        List<PdhProdSkuChgHistDto> result = pdhProdSkuChgHistMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdhProdSkuChgHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pdh_prod_sku_chg_hist :: select page :: [orm:mybatis]
        return PageResult.of(pdhProdSkuChgHistMapper.selectPageList(p), pdhProdSkuChgHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdhProdSkuChgHist entity) {
        // pdh_prod_sku_chg_hist :: update :: [orm:mybatis]
        int result = pdhProdSkuChgHistMapper.updateSelective(entity);
        return result;
    }

}
