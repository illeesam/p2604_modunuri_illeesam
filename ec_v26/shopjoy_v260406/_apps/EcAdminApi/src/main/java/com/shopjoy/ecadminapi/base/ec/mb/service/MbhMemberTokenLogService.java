package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbhMemberTokenLogMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberTokenLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MbhMemberTokenLogService {

    private final MbhMemberTokenLogMapper mapper;
    private final MbhMemberTokenLogRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public MbhMemberTokenLogDto getById(String id) {
        MbhMemberTokenLogDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<MbhMemberTokenLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<MbhMemberTokenLogDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<MbhMemberTokenLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(MbhMemberTokenLog entity) {
        int result = mapper.updateSelective(entity);
        return result;
    }

    @Transactional
    public void deleteAll() {
        repository.deleteAllBulk();
    }

}
