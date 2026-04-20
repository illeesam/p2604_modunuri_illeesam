package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmhPushLogMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmhPushLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CmhPushLogService {

    private final CmhPushLogMapper mapper;
    private final CmhPushLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmhPushLogDto getById(String id) {
        CmhPushLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmhPushLogDto> getList(Map<String, Object> p) {
        List<CmhPushLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmhPushLogDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<CmhPushLogDto> pageList = mapper.selectPageList(p);
        PageResult<CmhPushLogDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(CmhPushLog entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
