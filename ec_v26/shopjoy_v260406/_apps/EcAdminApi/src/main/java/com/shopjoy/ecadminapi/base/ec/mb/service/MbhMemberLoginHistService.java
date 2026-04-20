package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginHistDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginHist;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbhMemberLoginHistMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberLoginHistRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<MbhMemberLoginHistDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<MbhMemberLoginHistDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(MbhMemberLoginHist entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

}
