package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhDlivChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivChgHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class OdhDlivChgHistService {

    private final OdhDlivChgHistMapper mapper;
    private final OdhDlivChgHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public OdhDlivChgHistDto getById(String id) {
        OdhDlivChgHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<OdhDlivChgHistDto> getList(Map<String, Object> p) {
        List<OdhDlivChgHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<OdhDlivChgHistDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<OdhDlivChgHistDto> pageList = mapper.selectPageList(p);
        PageResult<OdhDlivChgHistDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(OdhDlivChgHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
