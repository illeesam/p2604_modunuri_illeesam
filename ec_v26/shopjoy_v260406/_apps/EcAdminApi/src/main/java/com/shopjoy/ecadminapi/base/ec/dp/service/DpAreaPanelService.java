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
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class DpAreaPanelService {

    private final DpAreaPanelMapper dpAreaPanelMapper;
    private final DpAreaPanelRepository dpAreaPanelRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DpAreaPanelDto getById(String id) {
        // dp_area_panel :: select one :: id [orm:mybatis]
        DpAreaPanelDto result = dpAreaPanelMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<DpAreaPanelDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_area_panel :: select list :: p [orm:mybatis]
        List<DpAreaPanelDto> result = dpAreaPanelMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<DpAreaPanelDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_area_panel :: select page :: [orm:mybatis]
        return PageResult.of(dpAreaPanelMapper.selectPageList(p), dpAreaPanelMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(DpAreaPanel entity) {
        // dp_area_panel :: update :: [orm:mybatis]
        int result = dpAreaPanelMapper.updateSelective(entity);
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
        DpAreaPanel result = dpAreaPanelRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public DpAreaPanel save(DpAreaPanel entity) {
        if (!dpAreaPanelRepository.existsById(entity.getAreaPanelId()))
            throw new CmBizException("존재하지 않는 DpAreaPanel입니다: " + entity.getAreaPanelId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_area_panel :: insert or update :: [orm:jpa]
        DpAreaPanel result = dpAreaPanelRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!dpAreaPanelRepository.existsById(id))
            throw new CmBizException("존재하지 않는 DpAreaPanel입니다: " + id);
        // dp_area_panel :: delete :: id [orm:jpa]
        dpAreaPanelRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<DpAreaPanel> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (DpAreaPanel row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setAreaPanelId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("dp_area_panel"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                dpAreaPanelRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getAreaPanelId(), "areaPanelId must not be null");
                DpAreaPanel entity = dpAreaPanelRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "areaPanelId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                dpAreaPanelRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getAreaPanelId(), "areaPanelId must not be null");
                if (dpAreaPanelRepository.existsById(id)) dpAreaPanelRepository.deleteById(id);
            }
        }
    }
}