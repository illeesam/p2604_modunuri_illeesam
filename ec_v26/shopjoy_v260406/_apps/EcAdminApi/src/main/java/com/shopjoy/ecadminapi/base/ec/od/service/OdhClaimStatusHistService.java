package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhClaimStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimStatusHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhClaimStatusHistService {

    private final OdhClaimStatusHistMapper mapper;
    private final OdhClaimStatusHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhClaimStatusHistDto getById(String id) {
        OdhClaimStatusHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhClaimStatusHistDto> getList(Map<String, Object> p) {
        List<OdhClaimStatusHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhClaimStatusHistDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<OdhClaimStatusHistDto> pageList = mapper.selectPageList(p);
        PageResult<OdhClaimStatusHistDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(OdhClaimStatusHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
