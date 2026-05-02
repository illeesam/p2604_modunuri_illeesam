package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpWidgetLibMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetLibRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class DpWidgetLibService {

    private final DpWidgetLibMapper mapper;
    private final DpWidgetLibRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpWidgetLibDto getById(String id) {
        // dp_widget_lib :: select one :: id [orm:mybatis]
        DpWidgetLibDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<DpWidgetLibDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_widget_lib :: select list :: p [orm:mybatis]
        List<DpWidgetLibDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<DpWidgetLibDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_widget_lib :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(DpWidgetLib entity) {
        // dp_widget_lib :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public DpWidgetLib create(DpWidgetLib entity) {
        entity.setWidgetLibId(CmUtil.generateId("dp_widget_lib"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_widget_lib :: insert or update :: [orm:jpa]
        DpWidgetLib result = repository.save(entity);
        return result;
    }

    @Transactional
    public DpWidgetLib save(DpWidgetLib entity) {
        if (!repository.existsById(entity.getWidgetLibId()))
            throw new CmBizException("존재하지 않는 DpWidgetLib입니다: " + entity.getWidgetLibId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_widget_lib :: insert or update :: [orm:jpa]
        DpWidgetLib result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 DpWidgetLib입니다: " + id);
        // dp_widget_lib :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

    @Transactional
    public void saveList(List<DpWidgetLib> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (DpWidgetLib row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setWidgetLibId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("dp_widget_lib"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getWidgetLibId(), "widgetLibId must not be null");
                DpWidgetLib entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "widgetLibId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getWidgetLibId(), "widgetLibId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}