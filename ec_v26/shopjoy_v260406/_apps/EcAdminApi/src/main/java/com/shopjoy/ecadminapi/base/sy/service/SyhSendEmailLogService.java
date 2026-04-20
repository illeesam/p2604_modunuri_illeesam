package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhSendEmailLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendEmailLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<SyhSendEmailLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhSendEmailLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyhSendEmailLog entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
