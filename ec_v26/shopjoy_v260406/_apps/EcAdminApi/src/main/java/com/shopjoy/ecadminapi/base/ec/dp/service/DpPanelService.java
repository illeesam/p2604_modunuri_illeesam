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
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DpPanelService {

    private final DpPanelMapper dpPanelMapper;
    private final DpPanelRepository dpPanelRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public DpPanelDto getById(String id) {
        // dp_panel :: select one :: id [orm:mybatis]
        DpPanelDto result = dpPanelMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<DpPanelDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_panel :: select list :: p [orm:mybatis]
        List<DpPanelDto> result = dpPanelMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<DpPanelDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_panel :: select page :: [orm:mybatis]
        return PageResult.of(dpPanelMapper.selectPageList(p), dpPanelMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(DpPanel entity) {
        // dp_panel :: update :: [orm:mybatis]
        int result = dpPanelMapper.updateSelective(entity);
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
        DpPanel result = dpPanelRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public DpPanel save(DpPanel entity) {
        if (!dpPanelRepository.existsById(entity.getPanelId()))
            throw new CmBizException("존재하지 않는 DpPanel입니다: " + entity.getPanelId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_panel :: insert or update :: [orm:jpa]
        DpPanel result = dpPanelRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!dpPanelRepository.existsById(id))
            throw new CmBizException("존재하지 않는 DpPanel입니다: " + id);
        // dp_panel :: delete :: id [orm:jpa]
        dpPanelRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<DpPanel> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (DpPanel row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setPanelId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("dp_panel"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                dpPanelRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getPanelId(), "panelId must not be null");
                DpPanel entity = dpPanelRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "panelId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                dpPanelRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getPanelId(), "panelId must not be null");
                if (dpPanelRepository.existsById(id)) dpPanelRepository.deleteById(id);
            }
        }
    }
}