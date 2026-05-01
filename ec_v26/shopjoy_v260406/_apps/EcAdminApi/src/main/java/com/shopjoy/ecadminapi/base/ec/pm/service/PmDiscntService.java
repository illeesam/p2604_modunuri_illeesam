package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmDiscntMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntRepository;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class PmDiscntService {


    private final PmDiscntMapper mapper;
    private final PmDiscntRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmDiscntDto getById(String id) {
        // pm_discnt :: select one :: id [orm:mybatis]
        PmDiscntDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmDiscntDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_discnt :: select list :: p [orm:mybatis]
        List<PmDiscntDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmDiscntDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_discnt :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmDiscnt entity) {
        // pm_discnt :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmDiscnt create(PmDiscnt entity) {
        entity.setDiscntId(CmUtil.generateId("pm_discnt"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_discnt :: insert or update :: [orm:jpa]
        PmDiscnt result = repository.save(entity);
        return result;
    }

    @Transactional
    public PmDiscnt save(PmDiscnt entity) {
        if (!repository.existsById(entity.getDiscntId()))
            throw new CmBizException("존재하지 않는 PmDiscnt입니다: " + entity.getDiscntId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_discnt :: insert or update :: [orm:jpa]
        PmDiscnt result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PmDiscnt입니다: " + id);
        // pm_discnt :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
