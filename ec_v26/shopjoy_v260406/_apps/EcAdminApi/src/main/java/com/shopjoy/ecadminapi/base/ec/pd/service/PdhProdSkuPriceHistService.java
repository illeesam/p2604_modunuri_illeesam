package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdSkuPriceHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdSkuPriceHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdhProdSkuPriceHistService {

    private final PdhProdSkuPriceHistMapper pdhProdSkuPriceHistMapper;
    private final PdhProdSkuPriceHistRepository pdhProdSkuPriceHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdhProdSkuPriceHistDto getById(String id) {
        // pdh_prod_sku_price_hist :: select one :: id [orm:mybatis]
        PdhProdSkuPriceHistDto result = pdhProdSkuPriceHistMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdhProdSkuPriceHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pdh_prod_sku_price_hist :: select list :: p [orm:mybatis]
        List<PdhProdSkuPriceHistDto> result = pdhProdSkuPriceHistMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdhProdSkuPriceHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pdh_prod_sku_price_hist :: select page :: [orm:mybatis]
        return PageResult.of(pdhProdSkuPriceHistMapper.selectPageList(p), pdhProdSkuPriceHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdhProdSkuPriceHist entity) {
        // pdh_prod_sku_price_hist :: update :: [orm:mybatis]
        int result = pdhProdSkuPriceHistMapper.updateSelective(entity);
        return result;
    }

}
