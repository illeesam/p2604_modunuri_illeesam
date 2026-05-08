package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.mapper.DpUiMapper;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpUiRepository;
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
public class DpUiService {

    private final DpUiMapper dpUiMapper;
    private final DpUiRepository dpUiRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public DpUiDto getById(String id) {
        // dp_ui :: select one :: id [orm:mybatis]
        DpUiDto result = dpUiMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<DpUiDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // dp_ui :: select list :: p [orm:mybatis]
        List<DpUiDto> result = dpUiMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<DpUiDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // dp_ui :: select page :: [orm:mybatis]
        return PageResult.of(dpUiMapper.selectPageList(p), dpUiMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(DpUi entity) {
        // dp_ui :: update :: [orm:mybatis]
        int result = dpUiMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public DpUi create(DpUi entity) {
        entity.setUiId(CmUtil.generateId("dp_ui"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_ui :: insert or update :: [orm:jpa]
        DpUi result = dpUiRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public DpUi save(DpUi entity) {
        if (!dpUiRepository.existsById(entity.getUiId()))
            throw new CmBizException("존재하지 않는 DpUi입니다: " + entity.getUiId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // dp_ui :: insert or update :: [orm:jpa]
        DpUi result = dpUiRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!dpUiRepository.existsById(id))
            throw new CmBizException("존재하지 않는 DpUi입니다: " + id);
        // dp_ui :: delete :: id [orm:jpa]
        dpUiRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<DpUi> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (DpUi row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setUiId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("dp_ui"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                dpUiRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getUiId(), "uiId must not be null");
                DpUi entity = dpUiRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "uiId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                dpUiRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getUiId(), "uiId must not be null");
                if (dpUiRepository.existsById(id)) dpUiRepository.deleteById(id);
            }
        }
    }
}