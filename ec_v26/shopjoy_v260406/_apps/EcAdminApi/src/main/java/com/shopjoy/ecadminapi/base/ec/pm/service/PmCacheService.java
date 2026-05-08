package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCacheMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCacheRepository;
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
public class PmCacheService {


    private final PmCacheMapper pmCacheMapper;
    private final PmCacheRepository pmCacheRepository;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public PmCacheDto getById(String id) {
        // pm_cache :: select one :: id [orm:mybatis]
        PmCacheDto result = pmCacheMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<PmCacheDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // pm_cache :: select list :: p [orm:mybatis]
        List<PmCacheDto> result = pmCacheMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<PmCacheDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // pm_cache :: select page :: [orm:mybatis]
        return PageResult.of(pmCacheMapper.selectPageList(p), pmCacheMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(PmCache entity) {
        // pm_cache :: update :: [orm:mybatis]
        int result = pmCacheMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public PmCache create(PmCache entity) {
        entity.setCacheId(CmUtil.generateId("pm_cache"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_cache :: insert or update :: [orm:jpa]
        PmCache result = pmCacheRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public PmCache save(PmCache entity) {
        if (!pmCacheRepository.existsById(entity.getCacheId()))
            throw new CmBizException("존재하지 않는 PmCache입니다: " + entity.getCacheId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // pm_cache :: insert or update :: [orm:jpa]
        PmCache result = pmCacheRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!pmCacheRepository.existsById(id))
            throw new CmBizException("존재하지 않는 PmCache입니다: " + id);
        // pm_cache :: delete :: id [orm:jpa]
        pmCacheRepository.deleteById(id);
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<PmCache> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (PmCache row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setCacheId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("pm_cache"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmCacheRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getCacheId(), "cacheId must not be null");
                PmCache entity = pmCacheRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "cacheId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                pmCacheRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getCacheId(), "cacheId must not be null");
                if (pmCacheRepository.existsById(id)) pmCacheRepository.deleteById(id);
            }
        }
    }
}