package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetLibRepository;
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
public class DpWidgetLibService {

    private final DpWidgetLibRepository dpWidgetLibRepository;

    @PersistenceContext
    private EntityManager em;

    /* 전시 위젯 라이브러리 키조회 */
    public DpWidgetLibDto.Item getById(String id) {
        DpWidgetLibDto.Item dto = dpWidgetLibRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpWidgetLibDto.Item getByIdOrNull(String id) {
        return dpWidgetLibRepository.selectById(id).orElse(null);
    }

    /* 전시 위젯 라이브러리 상세조회 */
    public DpWidgetLib findById(String id) {
        return dpWidgetLibRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpWidgetLib findByIdOrNull(String id) {
        return dpWidgetLibRepository.findById(id).orElse(null);
    }

    /* 전시 위젯 라이브러리 키검증 */
    public boolean existsById(String id) {
        return dpWidgetLibRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!dpWidgetLibRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 전시 위젯 라이브러리 목록조회 */
    public List<DpWidgetLibDto.Item> getList(DpWidgetLibDto.Request req) {
        return dpWidgetLibRepository.selectList(req);
    }

    /* 전시 위젯 라이브러리 페이지조회 */
    public DpWidgetLibDto.PageResponse getPageData(DpWidgetLibDto.Request req) {
        PageHelper.addPaging(req);
        return dpWidgetLibRepository.selectPageData(req);
    }

    /* 전시 위젯 라이브러리 등록 */
    @Transactional
    public DpWidgetLib create(DpWidgetLib body) {
        body.setWidgetLibId(CmUtil.generateId("dp_widget_lib"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpWidgetLib saved = dpWidgetLibRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 전시 위젯 라이브러리 수정 */
    @Transactional
    public DpWidgetLib update(String id, DpWidgetLib body) {
        CmUtil.requireId(id, "id", this);
        DpWidgetLib entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "widgetLibId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpWidgetLib saved = dpWidgetLibRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 전시 위젯 라이브러리 수정 */
    @Transactional
    public DpWidgetLib updateSelective(DpWidgetLib entity) {
        if (entity.getWidgetLibId() == null) throw new CmBizException("widgetLibId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getWidgetLibId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getWidgetLibId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpWidgetLibRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 전시 위젯 라이브러리 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        DpWidgetLib entity = findById(id);
        dpWidgetLibRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public DpWidgetLib saveOneBase(DpWidgetLib entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getWidgetLibId() == null || entity.getWidgetLibId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getWidgetLibId() == null)
                throw new CmBizException("삭제 대상 widgetLibId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!dpWidgetLibRepository.existsById(entity.getWidgetLibId()))
                throw new CmBizException("존재하지 않는 DpWidgetLib입니다: " + entity.getWidgetLibId() + "::" + CmUtil.svcCallerInfo(this));
            dpWidgetLibRepository.deleteById(entity.getWidgetLibId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setWidgetLibId(CmUtil.generateId("dp_widget_lib"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            DpWidgetLib saved = dpWidgetLibRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getWidgetLibId() == null)
                throw new CmBizException("수정 대상 widgetLibId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = dpWidgetLibRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 DpWidgetLib입니다: " + entity.getWidgetLibId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getWidgetLibId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<DpWidgetLib> rows) {
        /* 0단계: rowStatus 정규화 */
        for (DpWidgetLib row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getWidgetLibId() == null || row.getWidgetLibId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, DpWidgetLib::getWidgetLibId, "U", "widgetLibId", this);
        CmUtil.requireRowIds(rows, DpWidgetLib::getWidgetLibId, "D", "widgetLibId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(DpWidgetLib::getWidgetLibId)
            .toList();
        if (!deleteIds.isEmpty()) {
            dpWidgetLibRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<DpWidgetLib> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (DpWidgetLib row : updateRows) {
            row.setUpdBy(authId);
            int affected = dpWidgetLibRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getWidgetLibId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<DpWidgetLib> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpWidgetLib row : insertRows) {
            row.setWidgetLibId(CmUtil.generateId("dp_widget_lib"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            dpWidgetLibRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
        /** getPathTreeNodeCounts — 표시경로 노드별 DpWidgetLib 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(DpWidgetLibDto.Request req) {
        return dpWidgetLibRepository.selectPathTreeWidgetLibCnts(req);
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
