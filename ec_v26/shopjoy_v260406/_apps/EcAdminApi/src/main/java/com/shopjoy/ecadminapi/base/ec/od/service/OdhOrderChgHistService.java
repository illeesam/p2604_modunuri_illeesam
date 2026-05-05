package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhOrderChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderChgHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhOrderChgHistService {

    private final OdhOrderChgHistMapper odhOrderChgHistMapper;
    private final OdhOrderChgHistRepository odhOrderChgHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhOrderChgHistDto getById(String id) {
        OdhOrderChgHistDto result = odhOrderChgHistMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhOrderChgHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhOrderChgHistDto> result = odhOrderChgHistMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhOrderChgHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odhOrderChgHistMapper.selectPageList(p), odhOrderChgHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdhOrderChgHist entity) {
        int result = odhOrderChgHistMapper.updateSelective(entity);
        return result;
    }

}
