package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdContentChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdContentChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdContentChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdContentChgHistRepository;
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
public class PdhProdContentChgHistService {

    private final PdhProdContentChgHistMapper pdhProdContentChgHistMapper;
    private final PdhProdContentChgHistRepository pdhProdContentChgHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PdhProdContentChgHistDto getById(String id) {
        // pdh_prod_content_chg_hist :: select one :: id [orm:mybatis]
        PdhProdContentChgHistDto result = pdhProdContentChgHistMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PdhProdContentChgHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pdh_prod_content_chg_hist :: select list :: p [orm:mybatis]
        List<PdhProdContentChgHistDto> result = pdhProdContentChgHistMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PdhProdContentChgHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pdh_prod_content_chg_hist :: select page :: [orm:mybatis]
        return PageResult.of(pdhProdContentChgHistMapper.selectPageList(p), pdhProdContentChgHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PdhProdContentChgHist entity) {
        // pdh_prod_content_chg_hist :: update :: [orm:mybatis]
        int result = pdhProdContentChgHistMapper.updateSelective(entity);
        return result;
    }

}
