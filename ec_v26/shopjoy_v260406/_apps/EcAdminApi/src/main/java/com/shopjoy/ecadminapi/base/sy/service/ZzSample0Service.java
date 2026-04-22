package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample0Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample0;
import com.shopjoy.ecadminapi.base.sy.mapper.ZzSample0Mapper;
import com.shopjoy.ecadminapi.base.sy.repository.ZzSample0Repository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ZzSample0Service {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final ZzSample0Mapper mapper;
    private final ZzSample0Repository repository;

    @Transactional(readOnly = true)
    public ZzSample0Dto getById(String id) {
        return mapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<ZzSample0Dto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<ZzSample0Dto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(ZzSample0 entity) {
        return mapper.updateSelective(entity);
    }

    @Transactional
    public ZzSample0 create(ZzSample0 entity) {
        entity.setSample0Id(generateId());
        entity.setRegBy(SecurityUtil.getUserId());
        entity.setRegDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public ZzSample0 save(ZzSample0 entity) {
        if (!repository.existsById(entity.getSample0Id()))
            throw new CmBizException("존재하지 않는 ZzSample0입니다: " + entity.getSample0Id());
        entity.setUpdBy(SecurityUtil.getUserId());
        entity.setUpdDate(LocalDateTime.now());
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 ZzSample0입니다: " + id);
        repository.deleteById(id);
    }

    private String generateId() {
        return "ZS0" + LocalDateTime.now().format(ID_FMT) + (int)(Math.random() * 9000 + 1000);
    }
}
