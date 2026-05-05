package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhUserLoginLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserLoginLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoSyUserLoginLogService {

    private final SyhUserLoginLogMapper syhUserLoginLogMapper;
    private final SyhUserLoginLogRepository syhUserLoginLogRepository;

    @Transactional(readOnly = true)
    public List<SyhUserLoginLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return syhUserLoginLogMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyhUserLoginLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(syhUserLoginLogMapper.selectPageList(p), syhUserLoginLogMapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyhUserLoginLogDto getById(String id) {
        return syhUserLoginLogMapper.selectById(id);
    }

    @Transactional
    public void deleteAll() {
        syhUserLoginLogRepository.deleteAllBulk();
    }
}
