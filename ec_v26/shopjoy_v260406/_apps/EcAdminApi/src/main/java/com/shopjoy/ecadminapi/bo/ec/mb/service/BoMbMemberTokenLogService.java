package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
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
public class BoMbMemberTokenLogService {

    private final MbhMemberTokenLogMapper mapper;
    private final MbhMemberTokenLogRepository repository;

    @Transactional(readOnly = true)
    public List<MbhMemberTokenLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<MbhMemberTokenLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public MbhMemberTokenLogDto getById(String id) {
        return mapper.selectById(id);
    }

    @Transactional
    public void deleteAll() {
        repository.deleteAllBulk();
    }
}
