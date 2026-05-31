package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.repository.SyPropRepository;
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
public class SyPropService {

    private final SyPropRepository syPropRepository;

    @PersistenceContext
    private EntityManager em;

    /* 시스템 속성 키조회 */
    public SyPropDto.Item getById(String id) {
        SyPropDto.Item dto = syPropRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyPropDto.Item getByIdOrNull(String id) {
        return syPropRepository.selectById(id).orElse(null);
    }

    /* 시스템 속성 상세조회 */
    public SyProp findById(String id) {
        return syPropRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyProp findByIdOrNull(String id) {
        return syPropRepository.findById(id).orElse(null);
    }

    /* 시스템 속성 키검증 */
    public boolean existsById(String id) {
        return syPropRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syPropRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 시스템 속성 목록조회 */
    public List<SyPropDto.Item> getList(SyPropDto.Request req) {
        return syPropRepository.selectList(req);
    }

    /* 시스템 속성 페이지조회 */
    public SyPropDto.PageResponse getPageData(SyPropDto.Request req) {
        PageHelper.addPaging(req);
        return syPropRepository.selectPageList(req);
    }

    /* 시스템 속성 등록 */
    @Transactional
    public SyProp create(SyProp body) {
        body.setPropId(CmUtil.generateId("sy_prop"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyProp saved = syPropRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 시스템 속성 수정 */
    @Transactional
    public SyProp update(String id, SyProp body) {
        CmUtil.requireId(id, "id", this);
        SyProp entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "propId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyProp saved = syPropRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 시스템 속성 수정 */
    @Transactional
    public SyProp updateSelective(SyProp entity) {
        if (entity.getPropId() == null) throw new CmBizException("propId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getPropId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPropId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syPropRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 시스템 속성 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyProp entity = findById(id);
        syPropRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyProp save(String cmd, SyProp entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getPropId() == null || entity.getPropId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getPropId() == null)
                    throw new CmBizException("삭제 대상 propId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syPropRepository.existsById(entity.getPropId()))
                    throw new CmBizException("존재하지 않는 SyProp입니다: " + entity.getPropId() + "::" + CmUtil.svcCallerInfo(this));
                syPropRepository.deleteById(entity.getPropId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setPropId(CmUtil.generateId("sy_prop"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyProp saved = syPropRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getPropId() == null)
                    throw new CmBizException("수정 대상 propId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syPropRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyProp입니다: " + entity.getPropId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getPropId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyProp> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyProp row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getPropId() == null || row.getPropId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyProp::getPropId, "U", "propId", this);
            CmUtil.requireRowIds(rows, SyProp::getPropId, "D", "propId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyProp::getPropId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syPropRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyProp> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyProp row : updateRows) {
                row.setUpdBy(authId);
                int affected = syPropRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getPropId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyProp> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyProp row : insertRows) {
                row.setPropId(CmUtil.generateId("sy_prop"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syPropRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
    /** getPathTreeNodeCounts — 표시경로 노드별 SyProp 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건 (useYn / propType / searchValue) 이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.Map<String, Long> getPathTreeNodeCounts(SyPropDto.Request req) {
        java.util.Map<String, Long> result = new java.util.LinkedHashMap<>();
        String useYn       = (req == null) ? null : nullIfBlank(req.getUseYn());
        String propType    = (req == null) ? null : nullIfBlank(req.getPropTypeCd());
        String searchType  = (req == null) ? null : wrapCsv(req.getSearchType());
        String searchValue = (req == null) ? null : nullIfBlank(req.getSearchValue());
        for (Object[] row : syPropRepository.findPathSyPropTreeNodeCounts("sy_prop", useYn, propType, searchType, searchValue)) {
            String pathId = row[0] == null ? null : String.valueOf(row[0]);
            Long cnt = row[1] == null ? 0L : ((Number) row[1]).longValue();
            result.put(pathId, cnt);
        }
        return result;
    }

    private static String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }



    /** searchType csv 를 ',a,b,' 형태로 감싸 SQL `LIKE '%,a,%'` 매칭 가능하게 변환 */
    private static String wrapCsv(String s) {
        if (s == null || s.isBlank()) return null;
        return "," + s.trim().replaceAll("\\s*,\\s*", ",") + ",";
    }
}
