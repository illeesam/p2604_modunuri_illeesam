package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpAreaPanelMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpAreaPanelRepository;
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

@Service
@RequiredArgsConstructor
public class DpAreaPanelService {

    private final DpAreaPanelMapper mapper;
    private final DpAreaPanelRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpAreaPanelDto getById(String id) {
        // dp_area_panel :: select one :: id [orm:mybatis]
        DpAreaPanelDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<DpAreaPanelDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_area_panel :: select list :: p [orm:mybatis]
        List<DpAreaPanelDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<DpAreaPanelDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_area_panel :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(DpAreaPanel entity) {
        // dp_area_panel :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public DpAreaPanel create(DpAreaPanel entity) {
        entity.setAreaPanelId(CmUtil.generateId("dp_area_panel"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_area_panel :: insert or update :: [orm:jpa]
        DpAreaPanel result = repository.save(entity);
        return result;
    }

    @Transactional
    public DpAreaPanel save(DpAreaPanel entity) {
        if (!repository.existsById(entity.getAreaPanelId()))
            throw new CmBizException("존재하지 않는 DpAreaPanel입니다: " + entity.getAreaPanelId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_area_panel :: insert or update :: [orm:jpa]
        DpAreaPanel result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 DpAreaPanel입니다: " + id);
        // dp_area_panel :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
