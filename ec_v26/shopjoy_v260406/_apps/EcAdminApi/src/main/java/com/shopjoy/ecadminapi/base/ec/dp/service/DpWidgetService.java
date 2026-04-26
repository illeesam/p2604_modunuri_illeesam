package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpWidgetMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetRepository;
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
public class DpWidgetService {

    private final DpWidgetMapper mapper;
    private final DpWidgetRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpWidgetDto getById(String id) {
        // dp_widget :: select one :: id [orm:mybatis]
        DpWidgetDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<DpWidgetDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_widget :: select list :: p [orm:mybatis]
        List<DpWidgetDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<DpWidgetDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_widget :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(DpWidget entity) {
        // dp_widget :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public DpWidget create(DpWidget entity) {
        entity.setWidgetId(CmUtil.generateId("dp_widget"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_widget :: insert or update :: [orm:jpa]
        DpWidget result = repository.save(entity);
        return result;
    }

    @Transactional
    public DpWidget save(DpWidget entity) {
        if (!repository.existsById(entity.getWidgetId()))
            throw new CmBizException("존재하지 않는 DpWidget입니다: " + entity.getWidgetId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_widget :: insert or update :: [orm:jpa]
        DpWidget result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 DpWidget입니다: " + id);
        // dp_widget :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
