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
        return pmCacheRepository.selectPageData(req);
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

    

    /* 캐시(충전금) 수정 */
    @Transactional
    public PmCache update(String id, PmCache body) {
        CmUtil.requireId(id, "id", this);
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
        CmUtil.requireId(id, "id", this);
        PmCache entity = findById(id);
        pmCacheRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmCache saveOneBase(PmCache entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getCacheId() == null || entity.getCacheId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getCacheId() == null)
                throw new CmBizException("삭제 대상 cacheId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pmCacheRepository.existsById(entity.getCacheId()))
                throw new CmBizException("존재하지 않는 PmCache입니다: " + entity.getCacheId() + "::" + CmUtil.svcCallerInfo(this));
            pmCacheRepository.deleteById(entity.getCacheId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setCacheId(CmUtil.generateId("pm_cache"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PmCache saved = pmCacheRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getCacheId() == null)
                throw new CmBizException("수정 대상 cacheId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pmCacheRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PmCache입니다: " + entity.getCacheId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getCacheId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmCache> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PmCache row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getCacheId() == null || row.getCacheId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmCache::getCacheId, "U", "cacheId", this);
        CmUtil.requireRowIds(rows, PmCache::getCacheId, "D", "cacheId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmCache::getCacheId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmCacheRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PmCache> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmCache row : updateRows) {
            row.setUpdBy(authId);
            int affected = pmCacheRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getCacheId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PmCache> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmCache row : insertRows) {
            row.setCacheId(CmUtil.generateId("pm_cache"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmCacheRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
