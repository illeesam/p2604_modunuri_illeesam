package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhClaimItemStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimItemStatusHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhClaimItemStatusHistService {

    private final OdhClaimItemStatusHistMapper mapper;
    private final OdhClaimItemStatusHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhClaimItemStatusHistDto getById(String id) {
        OdhClaimItemStatusHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhClaimItemStatusHistDto> getList(Map<String, Object> p) {
        List<OdhClaimItemStatusHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhClaimItemStatusHistDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<OdhClaimItemStatusHistDto> pageList = mapper.selectPageList(p);
        PageResult<OdhClaimItemStatusHistDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(OdhClaimItemStatusHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
