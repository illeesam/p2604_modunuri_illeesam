package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCacheRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PmCacheService {

    private final PmCacheRepository pmCacheRepository;

    @PersistenceContext
    private EntityManager em;

    /* 캐시(충전금) 키조회 */
    public PmCacheDto.Item getById(String id) {
        PmCacheDto.Item dto = pmCacheRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCacheDto.Item getByIdOrNull(String id) {
        return pmCacheRepository.selectById(id).orElse(null);
    }

    /* 캐시(충전금) 상세조회 */
    public PmCache findById(String id) {
        return pmCacheRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCache findByIdOrNull(String id) {
        return pmCacheRepository.findById(id).orElse(null);
    }

    /* 캐시(충전금) 키검증 */
    public boolean existsById(String id) {
        return pmCacheRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmCacheRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 캐시(충전금) 목록조회 */
    public List<PmCacheDto.Item> getList(PmCacheDto.Request req) {
        return pmCacheRepository.selectList(req);
    }

    /* 캐시(충전금) 페이지조회 */
    public PmCacheDto.PageResponse getPageData(PmCacheDto.Request req) {
        PageHelper.addPaging(req);
        return pmCacheRepository.selectPageList(req);
    }

    /* 캐시(충전금) 등록 */
    @Transactional
    public PmCache create(PmCache body) {
        body.setCacheId(CmUtil.generateId("pm_cache"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmCache saved = pmCacheRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 캐시(충전금) 저장 */
    @Transactional
    public PmCache save(PmCache entity) {
        if (!existsById(entity.getCacheId()))
            throw new CmBizException("존재하지 않는 PmCache입니다: " + entity.getCacheId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCache saved = pmCacheRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 캐시(충전금) 수정 */
    @Transactional
    public PmCache update(String id, PmCache body) {
        PmCache entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "cacheId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCache saved = pmCacheRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 캐시(충전금) 수정 */
    @Transactional
    public PmCache updateSelective(PmCache entity) {
        if (entity.getCacheId() == null) throw new CmBizException("cacheId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getCacheId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getCacheId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmCacheRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 캐시(충전금) 삭제 */
    @Transactional
    public void delete(String id) {
        PmCache entity = findById(id);
        pmCacheRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 캐시(충전금) 목록저장 */
    @Transactional
    public void saveList(List<PmCache> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getCacheId() != null)
            .map(PmCache::getCacheId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmCacheRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmCache> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getCacheId() != null)
            .toList();
        for (PmCache row : updateRows) {
            PmCache entity = findById(row.getCacheId());
            VoUtil.voCopyExclude(row, entity, "cacheId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmCacheRepository.save(entity);
        }
        em.flush();

        List<PmCache> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmCache row : insertRows) {
            row.setCacheId(CmUtil.generateId("pm_cache"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmCacheRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
