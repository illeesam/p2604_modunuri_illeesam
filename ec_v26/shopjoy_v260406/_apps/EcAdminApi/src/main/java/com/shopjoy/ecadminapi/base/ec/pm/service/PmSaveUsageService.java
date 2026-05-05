package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveUsage;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmSaveUsageMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveUsageRepository;
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
public class PmSaveUsageService {


    private final PmSaveUsageMapper pmSaveUsageMapper;
    private final PmSaveUsageRepository pmSaveUsageRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PmSaveUsageDto getById(String id) {
        PmSaveUsageDto result = pmSaveUsageMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<PmSaveUsageDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<PmSaveUsageDto> result = pmSaveUsageMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<PmSaveUsageDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(pmSaveUsageMapper.selectPageList(p), pmSaveUsageMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(PmSaveUsage entity) {
        int result = pmSaveUsageMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmSaveUsage create(PmSaveUsage entity) {
        entity.setSaveUsageId(CmUtil.generateId("pm_save_usage"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveUsage result = pmSaveUsageRepository.save(entity);
        return result;
    }

    @Transactional
    public PmSaveUsage save(PmSaveUsage entity) {
        if (!pmSaveUsageRepository.existsById(entity.getSaveUsageId()))
            throw new CmBizException("존재하지 않는 PmSaveUsage입니다: " + entity.getSaveUsageId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveUsage result = pmSaveUsageRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        if (!pmSaveUsageRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmSaveUsage입니다: " + id);
        pmSaveUsageRepository.deleteById(id);
    }

    @Transactional
    public void saveList(List<PmSaveUsage> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmSaveUsage row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setSaveUsageId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_save_usage"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmSaveUsageRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getSaveUsageId(), "saveUsageId must not be null");
                PmSaveUsage entity = pmSaveUsageRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "saveUsageId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmSaveUsageRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getSaveUsageId(), "saveUsageId must not be null");
                if (pmSaveUsageRepository.existsById(id)) pmSaveUsageRepository.deleteById(id);
            }
        }
    }
}