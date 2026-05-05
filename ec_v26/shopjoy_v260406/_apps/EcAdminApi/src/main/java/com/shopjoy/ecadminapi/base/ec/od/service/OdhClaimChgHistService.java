package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhClaimChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimChgHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhClaimChgHistService {

    private final OdhClaimChgHistMapper odhClaimChgHistMapper;
    private final OdhClaimChgHistRepository odhClaimChgHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhClaimChgHistDto getById(String id) {
        OdhClaimChgHistDto result = odhClaimChgHistMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhClaimChgHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhClaimChgHistDto> result = odhClaimChgHistMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhClaimChgHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odhClaimChgHistMapper.selectPageList(p), odhClaimChgHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdhClaimChgHist entity) {
        int result = odhClaimChgHistMapper.updateSelective(entity);
        return result;
    }

}
