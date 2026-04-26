package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPathDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;
import com.shopjoy.ecadminapi.base.ec.cm.mapper.CmPathMapper;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmPathRepository;
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
public class CmPathService {

    private final CmPathMapper mapper;
    private final CmPathRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public CmPathDto getById(String id) {
        // cm_path :: select one :: id [orm:mybatis]
        CmPathDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<CmPathDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // cm_path :: select list :: p [orm:mybatis]
        List<CmPathDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<CmPathDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // cm_path :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(CmPath entity) {
        // cm_path :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public CmPath create(CmPath entity) {
        entity.setBizCd(CmUtil.generateId("cm_path"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_path :: insert or update :: [orm:jpa]
        CmPath result = repository.save(entity);
        return result;
    }

    @Transactional
    public CmPath save(CmPath entity) {
        if (!repository.existsById(entity.getBizCd()))
            throw new CmBizException("존재하지 않는 CmPath입니다: " + entity.getBizCd());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // cm_path :: insert or update :: [orm:jpa]
        CmPath result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 CmPath입니다: " + id);
        // cm_path :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
