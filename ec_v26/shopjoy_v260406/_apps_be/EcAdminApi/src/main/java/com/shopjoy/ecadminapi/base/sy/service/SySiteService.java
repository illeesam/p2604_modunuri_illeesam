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
        return sySiteRepository.selectPageData(req);
    }

    /** getPathTreeNodeCounts — 표시경로 노드별 사이트수 집계 (검색조건 + 자손 누적, 동적 native CTE).
     *   검색조건이 있으면 그 조건에 부합하는 사이트만 카운트 (page 그리드 결과와 동기).
     *   결과: [{pathId: 'XXX', cnt: 5}, {pathId: '__total__', cnt: 12}, {pathId: '__orphan__', cnt: 0}, ...]. */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(SySiteDto.Request req) {
        return sySiteRepository.selectPathTreeSiteCnts(req);
    }

    /* 공백·null 정규화 — '' 도 null 로 취급해 SQL 의 :param IS NULL 분기 활성화 */

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

    /** update — 선택 필드 수정 (JPA + VoUtil voCopyExclude) */
    @Transactional
    public SySite update(String id, SySite body) {
        CmUtil.requireId(id, "id", this);
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
        CmUtil.requireId(id, "id", this);
        SySite entity = findById(id);
        sySiteRepository.delete(entity);
        em.flush();
        if (existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList — 일괄 저장 */

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SySite saveOneBase(SySite entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getSiteId() == null || entity.getSiteId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getSiteId() == null)
                throw new CmBizException("삭제 대상 siteId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!sySiteRepository.existsById(entity.getSiteId()))
                throw new CmBizException("존재하지 않는 SySite입니다: " + entity.getSiteId() + "::" + CmUtil.svcCallerInfo(this));
            sySiteRepository.deleteById(entity.getSiteId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setSiteId(CmUtil.generateId("sy_site"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            SySite saved = sySiteRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getSiteId() == null)
                throw new CmBizException("수정 대상 siteId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = sySiteRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 SySite입니다: " + entity.getSiteId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getSiteId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<SySite> rows) {
        /* 0단계: rowStatus 정규화 */
        for (SySite row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getSiteId() == null || row.getSiteId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, SySite::getSiteId, "U", "siteId", this);
        CmUtil.requireRowIds(rows, SySite::getSiteId, "D", "siteId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(SySite::getSiteId)
            .toList();
        if (!deleteIds.isEmpty()) {
            sySiteRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<SySite> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (SySite row : updateRows) {
            row.setUpdBy(authId);
            int affected = sySiteRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSiteId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<SySite> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SySite row : insertRows) {
            row.setSiteId(CmUtil.generateId("sy_site"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            sySiteRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
