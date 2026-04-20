package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhClaimItemChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimItemChgHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhClaimItemChgHistService {

    private final OdhClaimItemChgHistMapper mapper;
    private final OdhClaimItemChgHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhClaimItemChgHistDto getById(String id) {
        OdhClaimItemChgHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhClaimItemChgHistDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<OdhClaimItemChgHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhClaimItemChgHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(OdhClaimItemChgHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
