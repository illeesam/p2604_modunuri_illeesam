package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpPanelItemMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpPanelItemRepository;
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
public class DpPanelItemService {

    private final DpPanelItemMapper dpPanelItemMapper;
    private final DpPanelItemRepository dpPanelItemRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpPanelItemDto getById(String id) {
        // dp_panel_item :: select one :: id [orm:mybatis]
        DpPanelItemDto result = dpPanelItemMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<DpPanelItemDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_panel_item :: select list :: p [orm:mybatis]
        List<DpPanelItemDto> result = dpPanelItemMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<DpPanelItemDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_panel_item :: select page :: [orm:mybatis]
        return PageResult.of(dpPanelItemMapper.selectPageList(p), dpPanelItemMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(DpPanelItem entity) {
        // dp_panel_item :: update :: [orm:mybatis]
        int result = dpPanelItemMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public DpPanelItem create(DpPanelItem entity) {
        entity.setPanelItemId(CmUtil.generateId("dp_panel_item"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_panel_item :: insert or update :: [orm:jpa]
        DpPanelItem result = dpPanelItemRepository.save(entity);
        return result;
    }

    @Transactional
    public DpPanelItem save(DpPanelItem entity) {
        if (!dpPanelItemRepository.existsById(entity.getPanelItemId()))
            throw new CmBizException("존재하지 않는 DpPanelItem입니다: " + entity.getPanelItemId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_panel_item :: insert or update :: [orm:jpa]
        DpPanelItem result = dpPanelItemRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!dpPanelItemRepository.existsById(id))
            throw new CmBizException("존재하지 않는 DpPanelItem입니다: " + id);
        // dp_panel_item :: delete :: id [orm:jpa]
        dpPanelItemRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<DpPanelItem> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (DpPanelItem row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setPanelItemId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("dp_panel_item"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                dpPanelItemRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getPanelItemId(), "panelItemId must not be null");
                DpPanelItem entity = dpPanelItemRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "panelItemId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                dpPanelItemRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getPanelItemId(), "panelItemId must not be null");
                if (dpPanelItemRepository.existsById(id)) dpPanelItemRepository.deleteById(id);
            }
        }
    }
}