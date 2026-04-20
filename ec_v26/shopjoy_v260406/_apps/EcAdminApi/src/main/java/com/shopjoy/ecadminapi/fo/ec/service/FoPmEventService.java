package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmEventMapper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FO 이벤트 서비스 — 진행 중 이벤트 조회
 * URL: /api/fo/ec/pm/event
 */
@Service
@RequiredArgsConstructor
public class FoPmEventService {

    private final PmEventMapper mapper;

    @Transactional(readOnly = true)
    public List<PmEventDto> getList(Map<String, Object> p) {
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<PmEventDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        Map<String, Object> param = new HashMap<>(p);
        param.put("limit",  pageSize);
        param.put("offset", (pageNo - 1) * pageSize);
        return PageResult.of(mapper.selectPageList(param), mapper.selectPageCount(param), pageNo, pageSize, p);
    }

    @Transactional(readOnly = true)
    public PmEventDto getById(String eventId) {
        PmEventDto dto = mapper.selectById(eventId);
        if (dto == null) throw new CmBizException("존재하지 않는 이벤트입니다: " + eventId);
        return dto;
    }
}
