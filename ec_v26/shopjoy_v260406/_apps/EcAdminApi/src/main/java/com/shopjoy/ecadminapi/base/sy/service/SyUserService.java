package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.base.sy.mapper.SyUserMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyUserRepository;
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
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class SyUserService {


    private final SyUserMapper mapper;
    private final SyUserRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyUserDto getById(String id) {
        // sy_user :: select one :: id [orm:mybatis]
        SyUserDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyUserDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_user :: select list :: p [orm:mybatis]
        List<SyUserDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyUserDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_user :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyUser entity) {
        // sy_user :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyUser create(SyUser entity) {
        entity.setUserId(CmUtil.generateId("sy_user"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_user :: insert or update :: [orm:jpa]
        SyUser result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyUser save(SyUser entity) {
        if (!repository.existsById(entity.getUserId()))
            throw new CmBizException("존재하지 않는 SyUser입니다: " + entity.getUserId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_user :: insert or update :: [orm:jpa]
        SyUser result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyUser입니다: " + id);
        // sy_user :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
