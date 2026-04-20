package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginHistDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginHist;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbhMemberLoginHistMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberLoginHistRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MbhMemberLoginHistService {

    private final MbhMemberLoginHistMapper mapper;
    private final MbhMemberLoginHistRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbhMemberLoginHistDto getById(String id) {
        MbhMemberLoginHistDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<MbhMemberLoginHistDto> getList(Map<String, Object> p) {
        List<MbhMemberLoginHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<MbhMemberLoginHistDto> getPageData(Map<String, Object> p, int pageNo, int pageSize) {
        p = new HashMap<>(p);
        int offset = (pageNo - 1) * pageSize;
        p.put("limit", pageSize);
        p.put("offset", offset);
        long totalCount = mapper.selectPageCount(p);
        List<MbhMemberLoginHistDto> pageList = mapper.selectPageList(p);
        PageResult<MbhMemberLoginHistDto> result = PageResult.of(pageList, totalCount, pageNo, pageSize, p);
        return result;
    }

    @Transactional
    public int update(MbhMemberLoginHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
