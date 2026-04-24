package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.mapper.SyI18nMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nRepository;
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
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

@Service
@RequiredArgsConstructor
public class SyI18nService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final SyI18nMapper mapper;
    private final SyI18nRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyI18nDto getById(String id) {
        // sy_i18n :: select one :: id [orm:mybatis]
        SyI18nDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyI18nDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_i18n :: select list :: p [orm:mybatis]
        List<SyI18nDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyI18nDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_i18n :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyI18n entity) {
        // sy_i18n :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyI18n create(SyI18n entity) {
        entity.setI18nId(generateId());
        entity.setRegBy(SecurityUtil.getAuthUser().userId());
        entity.setRegDate(LocalDateTime.now());
        // sy_i18n :: insert or update :: [orm:jpa]
        SyI18n result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyI18n save(SyI18n entity) {
        if (!repository.existsById(entity.getI18nId()))
            throw new CmBizException("존재하지 않는 SyI18n입니다: " + entity.getI18nId());
        entity.setUpdBy(SecurityUtil.getAuthUser().userId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_i18n :: insert or update :: [orm:jpa]
        SyI18n result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 SyI18n입니다: " + id);
        // sy_i18n :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    /** ID 생성: prefix=I1 (sy_i18n) */
    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int)(Math.random() * 10000));
        return "I1" + ts + rand;
    }
}
