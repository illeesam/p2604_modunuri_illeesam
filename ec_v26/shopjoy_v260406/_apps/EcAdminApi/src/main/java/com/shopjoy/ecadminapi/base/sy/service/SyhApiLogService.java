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

    private final SyhApiLogMapper mapper;
    private final SyhApiLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhApiLogDto getById(String id) {
        // syh_api_log :: select one :: id [orm:mybatis]
        SyhApiLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhApiLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // syh_api_log :: select list :: p [orm:mybatis]
        List<SyhApiLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhApiLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // syh_api_log :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyhApiLog entity) {
        // syh_api_log :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

}
