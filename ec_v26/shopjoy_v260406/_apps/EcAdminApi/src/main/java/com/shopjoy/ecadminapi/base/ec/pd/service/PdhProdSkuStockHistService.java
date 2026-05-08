package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdSkuStockHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdSkuStockHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdhProdSkuStockHistService {

    private final PdhProdSkuStockHistMapper pdhProdSkuStockHistMapper;
    private final PdhProdSkuStockHistRepository pdhProdSkuStockHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PdhProdSkuStockHistDto getById(String id) {
        // pdh_prod_sku_stock_hist :: select one :: id [orm:mybatis]
        PdhProdSkuStockHistDto result = pdhProdSkuStockHistMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PdhProdSkuStockHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pdh_prod_sku_stock_hist :: select list :: p [orm:mybatis]
        List<PdhProdSkuStockHistDto> result = pdhProdSkuStockHistMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PdhProdSkuStockHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pdh_prod_sku_stock_hist :: select page :: [orm:mybatis]
        return PageResult.of(pdhProdSkuStockHistMapper.selectPageList(p), pdhProdSkuStockHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PdhProdSkuStockHist entity) {
        // pdh_prod_sku_stock_hist :: update :: [orm:mybatis]
        int result = pdhProdSkuStockHistMapper.updateSelective(entity);
        return result;
    }

}
