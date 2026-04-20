package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdContentChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdContentChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdContentChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdContentChgHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PdhProdContentChgHistService {

    private final PdhProdContentChgHistMapper mapper;
    private final PdhProdContentChgHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PdhProdContentChgHistDto getById(String id) {
        PdhProdContentChgHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PdhProdContentChgHistDto> getList(Map<String, Object> p) {
        List<PdhProdContentChgHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PdhProdContentChgHistDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<PdhProdContentChgHistDto> pageList = mapper.selectPageList(p);
        PageResult<PdhProdContentChgHistDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(PdhProdContentChgHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
