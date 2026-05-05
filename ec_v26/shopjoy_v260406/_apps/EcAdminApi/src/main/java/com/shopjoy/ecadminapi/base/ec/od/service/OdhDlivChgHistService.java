package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhDlivChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivChgHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhDlivChgHistService {

    private final OdhDlivChgHistMapper odhDlivChgHistMapper;
    private final OdhDlivChgHistRepository odhDlivChgHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhDlivChgHistDto getById(String id) {
        OdhDlivChgHistDto result = odhDlivChgHistMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhDlivChgHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhDlivChgHistDto> result = odhDlivChgHistMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhDlivChgHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odhDlivChgHistMapper.selectPageList(p), odhDlivChgHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdhDlivChgHist entity) {
        int result = odhDlivChgHistMapper.updateSelective(entity);
        return result;
    }

}
