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

    private final DpAreaMapper mapper;
    private final DpAreaRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpAreaDto getById(String id) {
        // dp_area :: select one :: id [orm:mybatis]
        DpAreaDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<DpAreaDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_area :: select list :: p [orm:mybatis]
        List<DpAreaDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<DpAreaDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_area :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(DpArea entity) {
        // dp_area :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
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
        DpArea result = repository.save(entity);
        return result;
    }

    @Transactional
    public DpArea save(DpArea entity) {
        if (!repository.existsById(entity.getAreaId()))
            throw new CmBizException("존재하지 않는 DpArea입니다: " + entity.getAreaId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_area :: insert or update :: [orm:jpa]
        DpArea result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 DpArea입니다: " + id);
        // dp_area :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

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
                repository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getAreaId(), "areaId must not be null");
                DpArea entity = repository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "areaId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                repository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getAreaId(), "areaId must not be null");
                if (repository.existsById(id)) repository.deleteById(id);
            }
        }
    }
}