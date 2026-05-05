package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhBatchLogMapper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoSyBatchLogService {

    private final SyhBatchLogMapper syhBatchLogMapper;

    @Transactional(readOnly = true)
    public List<SyhBatchLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syhBatchLogMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyhBatchLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syhBatchLogMapper.selectPageList(p), syhBatchLogMapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyhBatchLogDto getById(String id) {
        return syhBatchLogMapper.selectById(id);
    }
}
