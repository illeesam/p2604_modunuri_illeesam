package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhOrderStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderStatusHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhOrderStatusHistService {

    private final OdhOrderStatusHistMapper odhOrderStatusHistMapper;
    private final OdhOrderStatusHistRepository odhOrderStatusHistRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhOrderStatusHistDto getById(String id) {
        OdhOrderStatusHistDto result = odhOrderStatusHistMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhOrderStatusHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhOrderStatusHistDto> result = odhOrderStatusHistMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhOrderStatusHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(odhOrderStatusHistMapper.selectPageList(p), odhOrderStatusHistMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdhOrderStatusHist entity) {
        int result = odhOrderStatusHistMapper.updateSelective(entity);
        return result;
    }

}
