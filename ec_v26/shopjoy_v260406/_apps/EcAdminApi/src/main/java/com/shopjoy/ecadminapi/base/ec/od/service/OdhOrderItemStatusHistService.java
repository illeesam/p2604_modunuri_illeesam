package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhOrderItemStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderItemStatusHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhOrderItemStatusHistService {

    private final OdhOrderItemStatusHistMapper mapper;
    private final OdhOrderItemStatusHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhOrderItemStatusHistDto getById(String id) {
        OdhOrderItemStatusHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhOrderItemStatusHistDto> getList(Map<String, Object> p) {
        List<OdhOrderItemStatusHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhOrderItemStatusHistDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<OdhOrderItemStatusHistDto> pageList = mapper.selectPageList(p);
        PageResult<OdhOrderItemStatusHistDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(OdhOrderItemStatusHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
