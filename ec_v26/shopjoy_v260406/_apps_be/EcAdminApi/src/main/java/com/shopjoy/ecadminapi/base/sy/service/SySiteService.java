package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
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
public class SySiteService {

    private final SySiteRepository sySiteRepository;

    @PersistenceContext
    private EntityManager em;

    /** getById — 단건조회 (QueryDSL, JOIN 필드 포함) */
    public SySiteDto.Item getById(String id) {
        SySiteDto.Item dto = sySiteRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SySiteDto.Item getByIdOrNull(String id) {
        return sySiteRepository.selectById(id).orElse(null);
    }

    /** findById — 단건조회 (JPA) */
    public SySite findById(String id) {
        return sySiteRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SySite findByIdOrNull(String id) {
        return sySiteRepository.findById(id).orElse(null);
    }

    /** existsById — 존재 여부 확인 (JPA) */
    public boolean existsById(String id) {
        return sySiteRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!sySiteRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /** getList — 목록조회 (QueryDSL) */
    public List<SySiteDto.Item> getList(SySiteDto.Request req) {
        return sySiteRepository.selectList(req);
    }

    /** getPageData — 페이징조회 (QueryDSL) */
    public SySiteDto.PageResponse getPageData(SySiteDto.Request req) {
        PageHelper.addPaging(req);
        return sySiteRepository.selectPageList(req);
    }

    // ── 변경 ────────────────────────────────────────────────────

    /** create — 생성 (JPA) */
    @Transactional
    public SySite create(SySite body) {
        body.setSiteId(CmUtil.generateId("sy_site"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SySite saved = sySiteRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** save — 전체 저장 (ID 존재 검증) */
    @Transactional
    public SySite save(SySite entity) {
        if (!existsById(entity.getSiteId()))
            throw new CmBizException("존재하지 않는 SySite입니다: " + entity.getSiteId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SySite saved = sySiteRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** update — 선택 필드 수정 (JPA + VoUtil voCopyExclude) */
    @Transactional
    public SySite update(String id, SySite body) {
        SySite entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "siteId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SySite saved = sySiteRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /** updateSelective — 선택 필드 수정 (QueryDSL selective UPDATE) */
    @Transactional
    public SySite updateSelective(SySite entity) {
        if (entity.getSiteId() == null)
            throw new CmBizException("siteId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSiteId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSiteId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = sySiteRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /** delete — 삭제 (JPA) */
    @Transactional
    public void delete(String id) {
        SySite entity = findById(id);
        sySiteRepository.delete(entity);
        em.flush();
        if (existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveList(List<SySite> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSiteId() != null)
            .map(SySite::getSiteId)
            .toList();
        if (!deleteIds.isEmpty()) {
            sySiteRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SySite> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSiteId() != null)
            .toList();
        for (SySite row : updateRows) {
            SySite entity = findById(row.getSiteId());
            VoUtil.voCopyExclude(row, entity, "siteId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            sySiteRepository.save(entity);
        }
        em.flush();

        List<SySite> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SySite row : insertRows) {
            row.setSiteId(CmUtil.generateId("sy_site"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            sySiteRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
