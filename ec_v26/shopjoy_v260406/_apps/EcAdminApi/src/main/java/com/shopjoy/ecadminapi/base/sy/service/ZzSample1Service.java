package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample1;
import com.shopjoy.ecadminapi.base.sy.mapper.ZzSample1Mapper;
import com.shopjoy.ecadminapi.base.sy.repository.ZzSample1Repository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ZzSample1Service {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final ZzSample1Mapper mapper;
    private final ZzSample1Repository repository;

    @Transactional(readOnly = true)
    public ZzSample1Dto getById(String id) {
        return mapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<ZzSample1Dto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<ZzSample1Dto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(ZzSample1 entity) {
        return mapper.updateSelective(entity);
    }

    @Transactional
    public ZzSample1 create(ZzSample1 entity) {
        entity.setSample1Id(generateId());
        entity.setRgtr(SecurityUtil.currentUserId());
        entity.setRegDt(LocalDate.now());
        return repository.save(entity);
    }

    @Transactional
    public ZzSample1 save(ZzSample1 entity) {
        if (!repository.existsById(entity.getSample1Id()))
            throw new CmBizException("존재하지 않는 ZzSample1입니다: " + entity.getSample1Id());
        entity.setMdfr(SecurityUtil.currentUserId());
        entity.setMdfcnDt(LocalDate.now());
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 ZzSample1입니다: " + id);
        repository.deleteById(id);
    }

    private String generateId() {
        return "ZS1" + LocalDate.now().format(ID_FMT) + (int)(Math.random() * 9000 + 1000);
    }
}
