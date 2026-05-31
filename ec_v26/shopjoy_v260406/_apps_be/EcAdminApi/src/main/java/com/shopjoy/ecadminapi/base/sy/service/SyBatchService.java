package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.SyBatchRepository;
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
public class SyBatchService {

    private final SyBatchRepository syBatchRepository;

    @PersistenceContext
    private EntityManager em;

    /* 배치 키조회 */
    public SyBatchDto.Item getById(String id) {
        SyBatchDto.Item dto = syBatchRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBatchDto.Item getByIdOrNull(String id) {
        return syBatchRepository.selectById(id).orElse(null);
    }

    /* 배치 상세조회 */
    public SyBatch findById(String id) {
        return syBatchRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBatch findByIdOrNull(String id) {
        return syBatchRepository.findById(id).orElse(null);
    }

    /* 배치 키검증 */
    public boolean existsById(String id) {
        return syBatchRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syBatchRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 배치 목록조회 */
    public List<SyBatchDto.Item> getList(SyBatchDto.Request req) {
        return syBatchRepository.selectList(req);
    }

    /* 배치 페이지조회 */
    public SyBatchDto.PageResponse getPageData(SyBatchDto.Request req) {
        PageHelper.addPaging(req);
        return syBatchRepository.selectPageList(req);
    }

    /* 배치 등록 */
    @Transactional
    public SyBatch create(SyBatch body) {
        body.setBatchId(CmUtil.generateId("sy_batch"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyBatch saved = syBatchRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 배치 수정 */
    @Transactional
    public SyBatch update(String id, SyBatch body) {
        CmUtil.requireId(id, "id", this);
        SyBatch entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "batchId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBatch saved = syBatchRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 배치 수정 */
    @Transactional
    public SyBatch updateSelective(SyBatch entity) {
        if (entity.getBatchId() == null) throw new CmBizException("batchId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBatchId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBatchId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syBatchRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 배치 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyBatch entity = findById(id);
        syBatchRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyBatch save(String cmd, SyBatch entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getBatchId() == null || entity.getBatchId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getBatchId() == null)
                    throw new CmBizException("삭제 대상 batchId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syBatchRepository.existsById(entity.getBatchId()))
                    throw new CmBizException("존재하지 않는 SyBatch입니다: " + entity.getBatchId() + "::" + CmUtil.svcCallerInfo(this));
                syBatchRepository.deleteById(entity.getBatchId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setBatchId(CmUtil.generateId("sy_batch"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyBatch saved = syBatchRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getBatchId() == null)
                    throw new CmBizException("수정 대상 batchId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syBatchRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyBatch입니다: " + entity.getBatchId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getBatchId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyBatch> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyBatch row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getBatchId() == null || row.getBatchId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyBatch::getBatchId, "U", "batchId", this);
            CmUtil.requireRowIds(rows, SyBatch::getBatchId, "D", "batchId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyBatch::getBatchId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syBatchRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyBatch> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyBatch row : updateRows) {
                row.setUpdBy(authId);
                int affected = syBatchRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getBatchId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyBatch> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyBatch row : insertRows) {
                row.setBatchId(CmUtil.generateId("sy_batch"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syBatchRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
        /** getPathTreeNodeCounts — 표시경로 노드별 SyBatch 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.Map<String, Long> getPathTreeNodeCounts(SyBatchDto.Request req) {
        java.util.Map<String, Long> result = new java.util.LinkedHashMap<>();
        String statusCd    = (req == null) ? null : nullIfBlank(req.getStatus());
        String searchType  = (req == null) ? null : wrapCsv(req.getSearchType());
        String searchValue = (req == null) ? null : nullIfBlank(req.getSearchValue());
        String dateStart   = (req == null) ? null : nullIfBlank(req.getDateStart());
        String dateEnd     = (req == null) ? null : nullIfBlank(req.getDateEnd());
        for (Object[] row : syBatchRepository.findPathSyBatchTreeNodeCounts("sy_batch", statusCd, searchType, searchValue, dateStart, dateEnd)) {
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
