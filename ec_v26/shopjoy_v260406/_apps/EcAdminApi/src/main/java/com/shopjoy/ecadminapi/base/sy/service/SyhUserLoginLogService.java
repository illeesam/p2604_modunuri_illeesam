package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhUserLoginLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserLoginLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhUserLoginLogService {

    private final SyhUserLoginLogMapper mapper;
    private final SyhUserLoginLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhUserLoginLogDto getById(String id) {
        SyhUserLoginLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhUserLoginLogDto> getList(Map<String, Object> p) {
        List<SyhUserLoginLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhUserLoginLogDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<SyhUserLoginLogDto> pageList = mapper.selectPageList(p);
        PageResult<SyhUserLoginLogDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(SyhUserLoginLog entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
