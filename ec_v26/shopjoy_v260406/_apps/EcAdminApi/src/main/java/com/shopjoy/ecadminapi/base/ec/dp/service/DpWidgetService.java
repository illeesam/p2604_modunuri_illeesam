package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpWidgetMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetRepository;
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
public class DpWidgetService {

    private final DpWidgetMapper dpWidgetMapper;
    private final DpWidgetRepository dpWidgetRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpWidgetDto getById(String id) {
        // dp_widget :: select one :: id [orm:mybatis]
        DpWidgetDto result = dpWidgetMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<DpWidgetDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_widget :: select list :: p [orm:mybatis]
        List<DpWidgetDto> result = dpWidgetMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<DpWidgetDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_widget :: select page :: [orm:mybatis]
        return PageResult.of(dpWidgetMapper.selectPageList(p), dpWidgetMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(DpWidget entity) {
        // dp_widget :: update :: [orm:mybatis]
        int result = dpWidgetMapper.updateSelective(entity);
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
        DpWidget result = dpWidgetRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public DpWidget save(DpWidget entity) {
        if (!dpWidgetRepository.existsById(entity.getWidgetId()))
            throw new CmBizException("존재하지 않는 DpWidget입니다: " + entity.getWidgetId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_widget :: insert or update :: [orm:jpa]
        DpWidget result = dpWidgetRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!dpWidgetRepository.existsById(id))
            throw new CmBizException("존재하지 않는 DpWidget입니다: " + id);
        // dp_widget :: delete :: id [orm:jpa]
        dpWidgetRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<DpWidget> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (DpWidget row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setWidgetId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("dp_widget"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                dpWidgetRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getWidgetId(), "widgetId must not be null");
                DpWidget entity = dpWidgetRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "widgetId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                dpWidgetRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getWidgetId(), "widgetId must not be null");
                if (dpWidgetRepository.existsById(id)) dpWidgetRepository.deleteById(id);
            }
        }
    }
}