package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhDlivItemChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivItemChgHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhDlivItemChgHistService {

    private final OdhDlivItemChgHistMapper mapper;
    private final OdhDlivItemChgHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhDlivItemChgHistDto getById(String id) {
        OdhDlivItemChgHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhDlivItemChgHistDto> getList(Map<String, Object> p) {
        List<OdhDlivItemChgHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhDlivItemChgHistDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<OdhDlivItemChgHistDto> pageList = mapper.selectPageList(p);
        PageResult<OdhDlivItemChgHistDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(OdhDlivItemChgHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
