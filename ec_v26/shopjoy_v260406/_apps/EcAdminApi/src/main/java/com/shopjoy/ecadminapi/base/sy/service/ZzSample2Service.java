package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample2Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample2;
import com.shopjoy.ecadminapi.base.sy.mapper.ZzSample2Mapper;
import com.shopjoy.ecadminapi.base.sy.repository.ZzSample2Repository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class ZzSample2Service {


    private final ZzSample2Mapper mapper;
    private final ZzSample2Repository repository;

    @Transactional(readOnly = true)
    public ZzSample2Dto getById(String id) {
        // zz_sample2 :: select one :: id [orm:mybatis]
        return mapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<ZzSample2Dto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // zz_sample2 :: select list :: p [orm:mybatis]
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<ZzSample2Dto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // zz_sample2 :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(ZzSample2 entity) {
        // zz_sample2 :: update :: entity [orm:mybatis]
        return mapper.updateSelective(entity);
    }

    @Transactional
    public ZzSample2 create(ZzSample2 entity) {
        entity.setSample2Id(CmUtil.generateId("zz_sample2"));
        entity.setRgtr(SecurityUtil.getAuthUser().authId());
        entity.setRegDt(LocalDate.now());
        // zz_sample2 :: insert or update :: [orm:jpa]
        return repository.save(entity);
    }

    @Transactional
    public ZzSample2 save(ZzSample2 entity) {
        if (!repository.existsById(entity.getSample2Id()))
            throw new CmBizException("존재하지 않는 ZzSample2입니다: " + entity.getSample2Id());
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        // zz_sample2 :: insert or update :: [orm:jpa]
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 ZzSample2입니다: " + id);
        // zz_sample2 :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
