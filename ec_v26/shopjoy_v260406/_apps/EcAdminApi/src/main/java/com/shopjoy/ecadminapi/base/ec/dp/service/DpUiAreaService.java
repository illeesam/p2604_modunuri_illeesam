package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpUiAreaMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpUiAreaRepository;
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
public class DpUiAreaService {

    private final DpUiAreaMapper mapper;
    private final DpUiAreaRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpUiAreaDto getById(String id) {
        // dp_ui_area :: select one :: id [orm:mybatis]
        DpUiAreaDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<DpUiAreaDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_ui_area :: select list :: p [orm:mybatis]
        List<DpUiAreaDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<DpUiAreaDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_ui_area :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(DpUiArea entity) {
        // dp_ui_area :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public DpUiArea create(DpUiArea entity) {
        entity.setUiAreaId(CmUtil.generateId("dp_area"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_ui_area :: insert or update :: [orm:jpa]
        DpUiArea result = repository.save(entity);
        return result;
    }

    @Transactional
    public DpUiArea save(DpUiArea entity) {
        if (!repository.existsById(entity.getUiAreaId()))
            throw new CmBizException("존재하지 않는 DpUiArea입니다: " + entity.getUiAreaId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_ui_area :: insert or update :: [orm:jpa]
        DpUiArea result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 DpUiArea입니다: " + id);
        // dp_ui_area :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
