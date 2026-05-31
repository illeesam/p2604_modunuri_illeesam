package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpAreaRepository;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DpAreaService {

    private final DpAreaRepository dpAreaRepository;

    @PersistenceContext
    private EntityManager em;

    /* 전시 영역 키조회 */
    public DpAreaDto.Item getById(String id) {
        DpAreaDto.Item dto = dpAreaRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpAreaDto.Item getByIdOrNull(String id) {
        return dpAreaRepository.selectById(id).orElse(null);
    }

    /* 전시 영역 상세조회 */
    public DpArea findById(String id) {
        return dpAreaRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpArea findByIdOrNull(String id) {
        return dpAreaRepository.findById(id).orElse(null);
    }

    /* 전시 영역 키검증 */
    public boolean existsById(String id) {
        return dpAreaRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!dpAreaRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 전시 영역 목록조회 */
    public List<DpAreaDto.Item> getList(DpAreaDto.Request req) {
        return dpAreaRepository.selectList(req);
    }

    /* 전시 영역 페이지조회 */
    public DpAreaDto.PageResponse getPageData(DpAreaDto.Request req) {
        PageHelper.addPaging(req);
        return dpAreaRepository.selectPageList(req);
    }

    /* 전시 영역 등록 */
    @Transactional
    public DpArea create(DpArea body) {
        body.setAreaId(CmUtil.generateId("dp_area"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpArea saved = dpAreaRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 전시 영역 수정 */
    @Transactional
    public DpArea update(String id, DpArea body) {
        CmUtil.requireId(id, "id", this);
        DpArea entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "areaId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpArea saved = dpAreaRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 전시 영역 수정 */
    @Transactional
    public DpArea updateSelective(DpArea entity) {
        if (entity.getAreaId() == null) throw new CmBizException("areaId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getAreaId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getAreaId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpAreaRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 전시 영역 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        DpArea entity = findById(id);
        dpAreaRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public DpArea save(String cmd, DpArea entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getAreaId() == null || entity.getAreaId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getAreaId() == null)
                    throw new CmBizException("삭제 대상 areaId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!dpAreaRepository.existsById(entity.getAreaId()))
                    throw new CmBizException("존재하지 않는 DpArea입니다: " + entity.getAreaId() + "::" + CmUtil.svcCallerInfo(this));
                dpAreaRepository.deleteById(entity.getAreaId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setAreaId(CmUtil.generateId("dp_area"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                DpArea saved = dpAreaRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getAreaId() == null)
                    throw new CmBizException("수정 대상 areaId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = dpAreaRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 DpArea입니다: " + entity.getAreaId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getAreaId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<DpArea> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (DpArea row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getAreaId() == null || row.getAreaId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, DpArea::getAreaId, "U", "areaId", this);
            CmUtil.requireRowIds(rows, DpArea::getAreaId, "D", "areaId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(DpArea::getAreaId)
                .toList();
            if (!deleteIds.isEmpty()) {
                dpAreaRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<DpArea> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (DpArea row : updateRows) {
                row.setUpdBy(authId);
                int affected = dpAreaRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getAreaId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<DpArea> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (DpArea row : insertRows) {
                row.setAreaId(CmUtil.generateId("dp_area"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                dpAreaRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
        /** getPathTreeNodeCounts — 표시경로 노드별 DpArea 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(DpAreaDto.Request req) {
        return dpAreaRepository.selectPathTreeCntsByBizCd(req);
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
