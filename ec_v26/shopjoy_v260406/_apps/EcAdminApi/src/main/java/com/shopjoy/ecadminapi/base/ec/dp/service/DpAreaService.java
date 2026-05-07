package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpAreaMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpAreaRepository;
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
public class DpAreaService {

    private final DpAreaMapper dpAreaMapper;
    private final DpAreaRepository dpAreaRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpAreaDto getById(String id) {
        // dp_area :: select one :: id [orm:mybatis]
        DpAreaDto result = dpAreaMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<DpAreaDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_area :: select list :: p [orm:mybatis]
        List<DpAreaDto> result = dpAreaMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<DpAreaDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_area :: select page :: [orm:mybatis]
        return PageResult.of(dpAreaMapper.selectPageList(p), dpAreaMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(DpArea entity) {
        // dp_area :: update :: [orm:mybatis]
        int result = dpAreaMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public DpArea create(DpArea entity) {
        entity.setAreaId(CmUtil.generateId("dp_area"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_area :: insert or update :: [orm:jpa]
        DpArea result = dpAreaRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public DpArea save(DpArea entity) {
        if (!dpAreaRepository.existsById(entity.getAreaId()))
            throw new CmBizException("존재하지 않는 DpArea입니다: " + entity.getAreaId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_area :: insert or update :: [orm:jpa]
        DpArea result = dpAreaRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!dpAreaRepository.existsById(id))
            throw new CmBizException("존재하지 않는 DpArea입니다: " + id);
        // dp_area :: delete :: id [orm:jpa]
        dpAreaRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<DpArea> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (DpArea row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setAreaId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("dp_area"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                dpAreaRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getAreaId(), "areaId must not be null");
                DpArea entity = dpAreaRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "areaId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                dpAreaRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getAreaId(), "areaId must not be null");
                if (dpAreaRepository.existsById(id)) dpAreaRepository.deleteById(id);
            }
        }
    }
}