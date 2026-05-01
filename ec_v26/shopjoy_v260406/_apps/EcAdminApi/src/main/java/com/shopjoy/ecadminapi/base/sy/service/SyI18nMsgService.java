package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.mapper.SyI18nMsgMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nMsgRepository;
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
public class SyI18nMsgService {


    private final SyI18nMsgMapper mapper;
    private final SyI18nMsgRepository repository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public SyI18nMsgDto getById(String id) {
        // sy_i18n_msg :: select one :: id [orm:mybatis]
        SyI18nMsgDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<SyI18nMsgDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // sy_i18n_msg :: select list :: p [orm:mybatis]
        List<SyI18nMsgDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<SyI18nMsgDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // sy_i18n_msg :: select page :: p [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(SyI18nMsg entity) {
        // sy_i18n_msg :: update :: entity [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public SyI18nMsg create(SyI18nMsg entity) {
        entity.setI18nMsgId(CmUtil.generateId("sy_i18n_msg"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_i18n_msg :: insert or update :: [orm:jpa]
        SyI18nMsg result = repository.save(entity);
        return result;
    }

    @Transactional
    public SyI18nMsg save(SyI18nMsg entity) {
        if (!repository.existsById(entity.getI18nMsgId()))
            throw new CmBizException("존재하지 않는 SyI18nMsg입니다: " + entity.getI18nMsgId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // sy_i18n_msg :: insert or update :: [orm:jpa]
        SyI18nMsg result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        SyI18nMsg entity = repository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        repository.delete(entity);
        em.flush();
        if (repository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

}
