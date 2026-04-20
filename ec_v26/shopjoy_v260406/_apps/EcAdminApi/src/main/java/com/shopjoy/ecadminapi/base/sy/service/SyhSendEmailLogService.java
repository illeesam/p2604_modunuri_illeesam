package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhSendEmailLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendEmailLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhSendEmailLogService {

    private final SyhSendEmailLogMapper mapper;
    private final SyhSendEmailLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhSendEmailLogDto getById(String id) {
        SyhSendEmailLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhSendEmailLogDto> getList(Map<String, Object> p) {
        List<SyhSendEmailLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhSendEmailLogDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<SyhSendEmailLogDto> pageList = mapper.selectPageList(p);
        PageResult<SyhSendEmailLogDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(SyhSendEmailLog entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
