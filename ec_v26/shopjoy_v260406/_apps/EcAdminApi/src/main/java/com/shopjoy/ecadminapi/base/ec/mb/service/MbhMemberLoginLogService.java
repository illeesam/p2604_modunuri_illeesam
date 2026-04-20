package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbhMemberLoginLogMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberLoginLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MbhMemberLoginLogService {

    private final MbhMemberLoginLogMapper mapper;
    private final MbhMemberLoginLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbhMemberLoginLogDto getById(String id) {
        MbhMemberLoginLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<MbhMemberLoginLogDto> getList(Map<String, Object> p) {
        List<MbhMemberLoginLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<MbhMemberLoginLogDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<MbhMemberLoginLogDto> pageList = mapper.selectPageList(p);
        PageResult<MbhMemberLoginLogDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(MbhMemberLoginLog entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
