package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhPayChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhPayChgHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhPayChgHistService {

    private final OdhPayChgHistMapper mapper;
    private final OdhPayChgHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhPayChgHistDto getById(String id) {
        OdhPayChgHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhPayChgHistDto> getList(Map<String, Object> p) {
        List<OdhPayChgHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhPayChgHistDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<OdhPayChgHistDto> pageList = mapper.selectPageList(p);
        PageResult<OdhPayChgHistDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(OdhPayChgHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
