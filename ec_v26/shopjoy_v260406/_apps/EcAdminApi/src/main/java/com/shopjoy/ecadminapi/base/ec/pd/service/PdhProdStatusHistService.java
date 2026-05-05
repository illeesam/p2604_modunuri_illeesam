package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdStatusHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdStatusHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdhProdStatusHistService {

    private final PdhProdStatusHistMapper pdhProdStatusHistMapper;
    private final PdhProdStatusHistRepository pdhProdStatusHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdhProdStatusHistDto getById(String id) {
        // pdh_prod_status_hist :: select one :: id [orm:mybatis]
        PdhProdStatusHistDto result = pdhProdStatusHistMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdhProdStatusHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pdh_prod_status_hist :: select list :: p [orm:mybatis]
        List<PdhProdStatusHistDto> result = pdhProdStatusHistMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdhProdStatusHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pdh_prod_status_hist :: select page :: [orm:mybatis]
        return PageResult.of(pdhProdStatusHistMapper.selectPageList(p), pdhProdStatusHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdhProdStatusHist entity) {
        // pdh_prod_status_hist :: update :: [orm:mybatis]
        int result = pdhProdStatusHistMapper.updateSelective(entity);
        return result;
    }

}
