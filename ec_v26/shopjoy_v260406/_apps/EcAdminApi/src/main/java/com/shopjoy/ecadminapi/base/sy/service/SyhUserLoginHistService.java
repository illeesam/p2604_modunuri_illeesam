package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginHist;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhUserLoginHistMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserLoginHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhUserLoginHistService {

    private final SyhUserLoginHistMapper mapper;
    private final SyhUserLoginHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhUserLoginHistDto getById(String id) {
        SyhUserLoginHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhUserLoginHistDto> getList(Map<String, Object> p) {
        List<SyhUserLoginHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhUserLoginHistDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<SyhUserLoginHistDto> pageList = mapper.selectPageList(p);
        PageResult<SyhUserLoginHistDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(SyhUserLoginHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
