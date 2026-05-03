package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;
import com.shopjoy.ecadminapi.base.sy.mapper.SyhAccessErrorLogMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyhAccessErrorLogRepository;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoSyAccessErrorLogService {

    private final SyhAccessErrorLogMapper mapper;
    private final SyhAccessErrorLogRepository repository;

    @Transactional(readOnly = true)
    public PageResult<SyhAccessErrorLogDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public void deleteAll() {
        repository.deleteAllBulk();
    }
}
