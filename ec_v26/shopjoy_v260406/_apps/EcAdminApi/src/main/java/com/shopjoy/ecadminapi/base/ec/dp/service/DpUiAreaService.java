package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpUiAreaMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpUiAreaRepository;
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
@Transactional(readOnly = true)
public class DpUiAreaService {

    private final DpUiAreaMapper dpUiAreaMapper;
    private final DpUiAreaRepository dpUiAreaRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public DpUiAreaDto getById(String id) {
        // dp_ui_area :: select one :: id [orm:mybatis]
        DpUiAreaDto result = dpUiAreaMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<DpUiAreaDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_ui_area :: select list :: p [orm:mybatis]
        List<DpUiAreaDto> result = dpUiAreaMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<DpUiAreaDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_ui_area :: select page :: [orm:mybatis]
        return PageResult.of(dpUiAreaMapper.selectPageList(p), dpUiAreaMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(DpUiArea entity) {
        // dp_ui_area :: update :: [orm:mybatis]
        int result = dpUiAreaMapper.updateSelective(entity);
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
        DpUiArea result = dpUiAreaRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public DpUiArea save(DpUiArea entity) {
        if (!dpUiAreaRepository.existsById(entity.getUiAreaId()))
            throw new CmBizException("존재하지 않는 DpUiArea입니다: " + entity.getUiAreaId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_ui_area :: insert or update :: [orm:jpa]
        DpUiArea result = dpUiAreaRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!dpUiAreaRepository.existsById(id))
            throw new CmBizException("존재하지 않는 DpUiArea입니다: " + id);
        // dp_ui_area :: delete :: id [orm:jpa]
        dpUiAreaRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<DpUiArea> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (DpUiArea row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setUiAreaId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("dp_area"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                dpUiAreaRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getUiAreaId(), "uiAreaId must not be null");
                DpUiArea entity = dpUiAreaRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "uiAreaId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                dpUiAreaRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getUiAreaId(), "uiAreaId must not be null");
                if (dpUiAreaRepository.existsById(id)) dpUiAreaRepository.deleteById(id);
            }
        }
    }
}