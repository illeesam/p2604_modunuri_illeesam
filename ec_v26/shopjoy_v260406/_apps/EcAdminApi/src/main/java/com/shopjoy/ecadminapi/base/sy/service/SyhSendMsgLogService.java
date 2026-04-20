package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhSendMsgLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhSendMsgLogRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SyhSendMsgLogService {

    private final SyhSendMsgLogMapper mapper;
    private final SyhSendMsgLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyhSendMsgLogDto getById(String id) {
        SyhSendMsgLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyhSendMsgLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<SyhSendMsgLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyhSendMsgLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyhSendMsgLog entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
