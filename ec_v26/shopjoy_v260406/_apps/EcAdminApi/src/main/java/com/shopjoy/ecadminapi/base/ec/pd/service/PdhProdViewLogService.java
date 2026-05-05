package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdViewLogDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdViewLog;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdViewLogMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdViewLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdhProdViewLogService {

    private final PdhProdViewLogMapper pdhProdViewLogMapper;
    private final PdhProdViewLogRepository pdhProdViewLogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdhProdViewLogDto getById(String id) {
        // pdh_prod_view_log :: select one :: id [orm:mybatis]
        PdhProdViewLogDto result = pdhProdViewLogMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdhProdViewLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pdh_prod_view_log :: select list :: p [orm:mybatis]
        List<PdhProdViewLogDto> result = pdhProdViewLogMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdhProdViewLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pdh_prod_view_log :: select page :: [orm:mybatis]
        return PageResult.of(pdhProdViewLogMapper.selectPageList(p), pdhProdViewLogMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PdhProdViewLog entity) {
        // pdh_prod_view_log :: update :: [orm:mybatis]
        int result = pdhProdViewLogMapper.updateSelective(entity);
        return result;
    }

}
