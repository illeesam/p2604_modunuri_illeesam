package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhApiLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhApiLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhApiLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhApiLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhApiLogService {

    private final SyhApiLogMapper syhApiLogMapper;
    private final SyhApiLogRepository syhApiLogRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhApiLogDto getById(String id) {
        // syh_api_log :: select one :: id [orm:mybatis]
        SyhApiLogDto result = syhApiLogMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhApiLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_api_log :: select list :: p [orm:mybatis]
        List<SyhApiLogDto> result = syhApiLogMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhApiLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_api_log :: select page :: [orm:mybatis]
        return PageResult.of(syhApiLogMapper.selectPageList(p), syhApiLogMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyhApiLog entity) {
        // syh_api_log :: update :: [orm:mybatis]
        int result = syhApiLogMapper.updateSelective(entity);
        return result;
    }

}
