package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdSkuPriceHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdSkuPriceHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdhProdSkuPriceHistService {

    private final PdhProdSkuPriceHistMapper mapper;
    private final PdhProdSkuPriceHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdhProdSkuPriceHistDto getById(String id) {
        PdhProdSkuPriceHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdhProdSkuPriceHistDto> getList(Map<String, Object> p) {
        List<PdhProdSkuPriceHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdhProdSkuPriceHistDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<PdhProdSkuPriceHistDto> pageList = mapper.selectPageList(p);
        PageResult<PdhProdSkuPriceHistDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(PdhProdSkuPriceHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
