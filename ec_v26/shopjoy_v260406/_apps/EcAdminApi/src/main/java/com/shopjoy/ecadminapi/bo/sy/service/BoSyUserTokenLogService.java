package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhUserTokenLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhUserTokenLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoSyUserTokenLogService {

    private final SyhUserTokenLogMapper mapper;
    private final SyhUserTokenLogRepository repository;

    @Transactional(readOnly = true)
    public List<SyhUserTokenLogDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<SyhUserTokenLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public SyhUserTokenLogDto getById(String id) {
        return mapper.selectById(id);
    }

    @Transactional
    public void deleteAll() {
        repository.deleteAllBulk();
    }
}
