package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmDiscntUsageMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntUsageRepository;
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
public class PmDiscntUsageService {


    private final PmDiscntUsageMapper pmDiscntUsageMapper;
    private final PmDiscntUsageRepository pmDiscntUsageRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PmDiscntUsageDto getById(String id) {
        // pm_discnt_usage :: select one :: id [orm:mybatis]
        PmDiscntUsageDto result = pmDiscntUsageMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PmDiscntUsageDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_discnt_usage :: select list :: p [orm:mybatis]
        List<PmDiscntUsageDto> result = pmDiscntUsageMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PmDiscntUsageDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_discnt_usage :: select page :: [orm:mybatis]
        return PageResult.of(pmDiscntUsageMapper.selectPageList(p), pmDiscntUsageMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmDiscntUsage entity) {
        // pm_discnt_usage :: update :: [orm:mybatis]
        int result = pmDiscntUsageMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmDiscntUsage create(PmDiscntUsage entity) {
        entity.setDiscntUsageId(CmUtil.generateId("pm_discnt_usage"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_discnt_usage :: insert or update :: [orm:jpa]
        PmDiscntUsage result = pmDiscntUsageRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmDiscntUsage save(PmDiscntUsage entity) {
        if (!pmDiscntUsageRepository.existsById(entity.getDiscntUsageId()))
            throw new CmBizException("존재하지 않는 PmDiscntUsage입니다: " + entity.getDiscntUsageId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_discnt_usage :: insert or update :: [orm:jpa]
        PmDiscntUsage result = pmDiscntUsageRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmDiscntUsageRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmDiscntUsage입니다: " + id);
        // pm_discnt_usage :: delete :: id [orm:jpa]
        pmDiscntUsageRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmDiscntUsage> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmDiscntUsage row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setDiscntUsageId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_discnt_usage"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmDiscntUsageRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getDiscntUsageId(), "discntUsageId must not be null");
                PmDiscntUsage entity = pmDiscntUsageRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "discntUsageId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmDiscntUsageRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getDiscntUsageId(), "discntUsageId must not be null");
                if (pmDiscntUsageRepository.existsById(id)) pmDiscntUsageRepository.deleteById(id);
            }
        }
    }
}