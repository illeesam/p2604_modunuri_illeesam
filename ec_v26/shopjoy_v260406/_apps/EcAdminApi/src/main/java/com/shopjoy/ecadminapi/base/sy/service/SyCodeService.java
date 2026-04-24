package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.mapper.SyCodeMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyCodeRepository;
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
public class SyCodeService {


    private final SyCodeMapper mapper;
    private final SyCodeRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyCodeDto getById(String id) {
        // sy_code :: select one :: id [orm:mybatis]
        SyCodeDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyCodeDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_code :: select list :: p [orm:mybatis]
        List<SyCodeDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyCodeDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_code :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyCode entity) {
        // sy_code :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyCode create(SyCode entity) {
        entity.setCodeId(CmUtil.generateId("sy_code"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // sy_code :: insert or update :: [orm:jpa]
        SyCode result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyCode save(SyCode entity) {
        if (!repository.existsById(entity.getCodeId()))
            throw new CmBizException("존재하지 않는 SyCode입니다: " + entity.getCodeId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_code :: insert or update :: [orm:jpa]
        SyCode result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyCode입니다: " + id);
        // sy_code :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
