package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhUserTokenLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserTokenLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhUserTokenLogService {

    private final SyhUserTokenLogMapper mapper;
    private final SyhUserTokenLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhUserTokenLogDto getById(String id) {
        SyhUserTokenLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhUserTokenLogDto> getList(Map<String, Object> p) {
        List<SyhUserTokenLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhUserTokenLogDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<SyhUserTokenLogDto> pageList = mapper.selectPageList(p);
        PageResult<SyhUserTokenLogDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(SyhUserTokenLog entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
