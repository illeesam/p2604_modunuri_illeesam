package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmSaveMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveRepository;
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
public class PmSaveService {


    private final PmSaveMapper pmSaveMapper;
    private final PmSaveRepository pmSaveRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmSaveDto getById(String id) {
        PmSaveDto result = pmSaveMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<PmSaveDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<PmSaveDto> result = pmSaveMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<PmSaveDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pmSaveMapper.selectPageList(p), pmSaveMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmSave entity) {
        int result = pmSaveMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmSave create(PmSave entity) {
        entity.setSaveId(CmUtil.generateId("pm_save"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSave result = pmSaveRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmSave save(PmSave entity) {
        if (!pmSaveRepository.existsById(entity.getSaveId()))
            throw new CmBizException("존재하지 않는 PmSave입니다: " + entity.getSaveId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSave result = pmSaveRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmSaveRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmSave입니다: " + id);
        pmSaveRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmSave> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmSave row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setSaveId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_save"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmSaveRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getSaveId(), "saveId must not be null");
                PmSave entity = pmSaveRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "saveId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmSaveRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getSaveId(), "saveId must not be null");
                if (pmSaveRepository.existsById(id)) pmSaveRepository.deleteById(id);
            }
        }
    }
}