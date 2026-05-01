package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample0Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample0;
import com.shopjoy.ecadminapi.base.sy.mapper.ZzSample0Mapper;
import com.shopjoy.ecadminapi.base.sy.repository.ZzSample0Repository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ZzSample0Service {


    private final ZzSample0Mapper mapper;
    private final ZzSample0Repository repository;

    @PersistenceContext
    private EntityManager em;

    @Transactional(readOnly = true)
    public ZzSample0Dto getById(String id) {
        // zz_sample0 :: select one :: id [orm:mybatis]
        return mapper.selectById(id);
    }

    @Transactional(readOnly = true)
    public List<ZzSample0Dto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // zz_sample0 :: select list :: p [orm:mybatis]
        return mapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public PageResult<ZzSample0Dto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // zz_sample0 :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(ZzSample0 entity) {
        // zz_sample0 :: update :: entity [orm:mybatis]
        return mapper.updateSelective(entity);
    }

    @Transactional
    public ZzSample0 create(ZzSample0 entity) {
        entity.setSample0Id(CmUtil.generateId("zz_sample0"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // zz_sample0 :: insert or update :: [orm:jpa]
        return repository.save(entity);
    }

    @Transactional
    public ZzSample0 save(ZzSample0 entity) {
        if (!repository.existsById(entity.getSample0Id()))
            throw new CmBizException("존재하지 않는 ZzSample0입니다: " + entity.getSample0Id());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // zz_sample0 :: insert or update :: [orm:jpa]
        return repository.save(entity);
    }

    @Transactional
    public void delete(String id) {
        ZzSample0 entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
