package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmEventMapper;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * FO 이벤트 서비스 — 진행 중 이벤트 조회
 * URL: /api/fo/ec/pm/event
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoPmEventService {

    private final PmEventMapper pmEventMapper;

    /** getList — 조회 */
    public List<PmEventDto.Item> getList(PmEventDto.Request req) {
        return pmEventMapper.selectList(req);
    }

    /** getPageData — 조회 */
    public PageResult<PmEventDto.Item> getPageData(PmEventDto.Request req) {
        PageHelper.addPaging(req);
        return PageResult.of(pmEventMapper.selectPageList(req), pmEventMapper.selectPageCount(req), PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    /** getById — 조회 */
    public PmEventDto.Item getById(String eventId) {
        PmEventDto.Item dto = pmEventMapper.selectById(eventId);
        if (dto == null) throw new CmBizException("존재하지 않는 이벤트입니다: " + eventId);
        return dto;
    }
}
