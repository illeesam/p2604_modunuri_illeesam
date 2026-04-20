package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhPayStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhPayStatusHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhPayStatusHistService {

    private final OdhPayStatusHistMapper mapper;
    private final OdhPayStatusHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhPayStatusHistDto getById(String id) {
        OdhPayStatusHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhPayStatusHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhPayStatusHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhPayStatusHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdhPayStatusHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
