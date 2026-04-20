package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhOrderItemChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderItemChgHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhOrderItemChgHistService {

    private final OdhOrderItemChgHistMapper mapper;
    private final OdhOrderItemChgHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhOrderItemChgHistDto getById(String id) {
        OdhOrderItemChgHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhOrderItemChgHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhOrderItemChgHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhOrderItemChgHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdhOrderItemChgHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
