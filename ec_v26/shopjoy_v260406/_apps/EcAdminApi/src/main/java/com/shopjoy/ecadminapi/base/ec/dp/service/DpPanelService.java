package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpPanelMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelRepository;
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
public class DpPanelService {

    private final DpPanelMapper mapper;
    private final DpPanelRepository repository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpPanelDto getById(String id) {
        // dp_panel :: select one :: id [orm:mybatis]
        DpPanelDto result = mapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<DpPanelDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_panel :: select list :: p [orm:mybatis]
        List<DpPanelDto> result = mapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<DpPanelDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_panel :: select page :: [orm:mybatis]
        return PageResult.of(mapper.selectPageList(p), mapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(DpPanel entity) {
        // dp_panel :: update :: [orm:mybatis]
        int result = mapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public DpPanel create(DpPanel entity) {
        entity.setPanelId(CmUtil.generateId("dp_panel"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_panel :: insert or update :: [orm:jpa]
        DpPanel result = repository.save(entity);
        return result;
    }

    @Transactional
    public DpPanel save(DpPanel entity) {
        if (!repository.existsById(entity.getPanelId()))
            throw new CmBizException("존재하지 않는 DpPanel입니다: " + entity.getPanelId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_panel :: insert or update :: [orm:jpa]
        DpPanel result = repository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!repository.existsById(id))
            throw new CmBizException("존재하지 않는 DpPanel입니다: " + id);
        // dp_panel :: delete :: id [orm:jpa]
        repository.deleteById(id);
    }

}
