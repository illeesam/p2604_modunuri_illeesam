package com.shopjoy.ecadminapi.bo.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdCartDto;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdCartMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdCartRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class BoOdCartService {
    private final OdCartMapper mapper;
    private final OdCartRepository repository;

    @Transactional(readOnly = true)
    public List<OdCartDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<OdCartDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
                PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional(readOnly = true)
    public OdCartDto getById(String id) {
        OdCartDto dto = mapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        repository.deleteById(id);
    }
}
