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

    private final MbhMemberTokenLogMapper mbhMemberTokenLogMapper;
    private final MbhMemberTokenLogRepository mbhMemberTokenLogRepository;

    @Transactional(readOnly = true)
    public List<MbhMemberTokenLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mbhMemberTokenLogMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<MbhMemberTokenLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mbhMemberTokenLogMapper.selectPageList(p), mbhMemberTokenLogMapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public MbhMemberTokenLogDto getById(String id) {
        return mbhMemberTokenLogMapper.selectById(id);
    }

    @Transactional
    public void deleteAll() {
        mbhMemberTokenLogRepository.deleteAllBulk();
    }
}
