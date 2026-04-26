package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCacheMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCacheRepository;
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
public class PmCacheService {


    private final PmCacheMapper mapper;
    private final PmCacheRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmCacheDto getById(String id) {
        // pm_cache :: select one :: id [orm:mybatis]
        PmCacheDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmCacheDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_cache :: select list :: p [orm:mybatis]
        List<PmCacheDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmCacheDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_cache :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmCache entity) {
        // pm_cache :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmCache create(PmCache entity) {
        entity.setCacheId(CmUtil.generateId("pm_cache"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_cache :: insert or update :: [orm:jpa]
        PmCache result = repository.save(entity);
        return result;
    }

    @Transactional
    public PmCache save(PmCache entity) {
        if (!repository.existsById(entity.getCacheId()))
            throw new CmBizException("존재하지 않는 PmCache입니다: " + entity.getCacheId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_cache :: insert or update :: [orm:jpa]
        PmCache result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PmCache입니다: " + id);
        // pm_cache :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
