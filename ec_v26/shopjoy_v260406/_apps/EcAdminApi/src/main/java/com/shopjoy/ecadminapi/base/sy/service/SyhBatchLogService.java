package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhBatchLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhBatchLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhBatchLogService {

    private final SyhBatchLogMapper mapper;
    private final SyhBatchLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhBatchLogDto getById(String id) {
        SyhBatchLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhBatchLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<SyhBatchLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhBatchLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyhBatchLog entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
