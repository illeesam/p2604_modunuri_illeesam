package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmEventMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventRepository;
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
public class PmEventService {


    private final PmEventMapper mapper;
    private final PmEventRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmEventDto getById(String id) {
        // pm_event :: select one :: id [orm:mybatis]
        PmEventDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmEventDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_event :: select list :: p [orm:mybatis]
        List<PmEventDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmEventDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_event :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmEvent entity) {
        // pm_event :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmEvent create(PmEvent entity) {
        entity.setEventId(CmUtil.generateId("pm_event"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        // pm_event :: insert or update :: [orm:jpa]
        PmEvent result = repository.save(entity);
        return result;
    }

    @Transactional
    public PmEvent save(PmEvent entity) {
        if (!repository.existsById(entity.getEventId()))
            throw new CmBizException("존재하지 않는 PmEvent입니다: " + entity.getEventId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_event :: insert or update :: [orm:jpa]
        PmEvent result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 PmEvent입니다: " + id);
        // pm_event :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
