package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.mapper.SyContactMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyContactRepository;
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
public class SyContactService {


    private final SyContactMapper mapper;
    private final SyContactRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyContactDto getById(String id) {
        // sy_contact :: select one :: id [orm:mybatis]
        SyContactDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyContactDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_contact :: select list :: p [orm:mybatis]
        List<SyContactDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyContactDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_contact :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyContact entity) {
        // sy_contact :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyContact create(SyContact entity) {
        entity.setContactId(CmUtil.generateId("sy_contact"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_contact :: insert or update :: [orm:jpa]
        SyContact result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyContact save(SyContact entity) {
        if (!repository.existsById(entity.getContactId()))
            throw new CmBizException("존재하지 않는 SyContact입니다: " + entity.getContactId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_contact :: insert or update :: [orm:jpa]
        SyContact result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyContact입니다: " + id);
        // sy_contact :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
