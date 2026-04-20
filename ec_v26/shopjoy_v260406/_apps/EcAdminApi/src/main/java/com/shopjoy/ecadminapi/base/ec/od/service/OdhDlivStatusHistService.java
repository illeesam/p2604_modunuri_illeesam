package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhDlivStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivStatusHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhDlivStatusHistService {

    private final OdhDlivStatusHistMapper mapper;
    private final OdhDlivStatusHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhDlivStatusHistDto getById(String id) {
        OdhDlivStatusHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhDlivStatusHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhDlivStatusHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhDlivStatusHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdhDlivStatusHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
