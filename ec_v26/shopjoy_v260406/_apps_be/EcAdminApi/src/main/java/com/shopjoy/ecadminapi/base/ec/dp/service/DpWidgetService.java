package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.base.ec.dp.repository.DpWidgetRepository;
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
public class DpWidgetService {

    private final DpWidgetRepository dpWidgetRepository;

    @PersistenceContext
    private EntityManager em;

    /* 전시 위젯 키조회 */
    public DpWidgetDto.Item getById(String id) {
        DpWidgetDto.Item dto = dpWidgetRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpWidgetDto.Item getByIdOrNull(String id) {
        return dpWidgetRepository.selectById(id).orElse(null);
    }

    /* 전시 위젯 상세조회 */
    public DpWidget findById(String id) {
        return dpWidgetRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpWidget findByIdOrNull(String id) {
        return dpWidgetRepository.findById(id).orElse(null);
    }

    /* 전시 위젯 키검증 */
    public boolean existsById(String id) {
        return dpWidgetRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!dpWidgetRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 전시 위젯 목록조회 */
    public List<DpWidgetDto.Item> getList(DpWidgetDto.Request req) {
        return dpWidgetRepository.selectList(req);
    }

    /* 전시 위젯 페이지조회 */
    public DpWidgetDto.PageResponse getPageData(DpWidgetDto.Request req) {
        PageHelper.addPaging(req);
        return dpWidgetRepository.selectPageList(req);
    }

    /* 전시 위젯 등록 */
    @Transactional
    public DpWidget create(DpWidget body) {
        body.setWidgetId(CmUtil.generateId("dp_widget"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        DpWidget saved = dpWidgetRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 전시 위젯 수정 */
    @Transactional
    public DpWidget update(String id, DpWidget body) {
        CmUtil.requireId(id, "id", this);
        DpWidget entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "widgetId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        DpWidget saved = dpWidgetRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 전시 위젯 수정 */
    @Transactional
    public DpWidget updateSelective(DpWidget entity) {
        if (entity.getWidgetId() == null) throw new CmBizException("widgetId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getWidgetId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getWidgetId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = dpWidgetRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 전시 위젯 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        DpWidget entity = findById(id);
        dpWidgetRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public DpWidget save(String cmd, DpWidget entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getWidgetId() == null || entity.getWidgetId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getWidgetId() == null)
                    throw new CmBizException("삭제 대상 widgetId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!dpWidgetRepository.existsById(entity.getWidgetId()))
                    throw new CmBizException("존재하지 않는 DpWidget입니다: " + entity.getWidgetId() + "::" + CmUtil.svcCallerInfo(this));
                dpWidgetRepository.deleteById(entity.getWidgetId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setWidgetId(CmUtil.generateId("dp_widget"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                DpWidget saved = dpWidgetRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getWidgetId() == null)
                    throw new CmBizException("수정 대상 widgetId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = dpWidgetRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 DpWidget입니다: " + entity.getWidgetId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getWidgetId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<DpWidget> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (DpWidget row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getWidgetId() == null || row.getWidgetId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, DpWidget::getWidgetId, "U", "widgetId", this);
            CmUtil.requireRowIds(rows, DpWidget::getWidgetId, "D", "widgetId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(DpWidget::getWidgetId)
                .toList();
            if (!deleteIds.isEmpty()) {
                dpWidgetRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<DpWidget> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (DpWidget row : updateRows) {
                row.setUpdBy(authId);
                int affected = dpWidgetRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getWidgetId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<DpWidget> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (DpWidget row : insertRows) {
                row.setWidgetId(CmUtil.generateId("dp_widget"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                dpWidgetRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
        /** getPathTreeNodeCounts — 표시경로 노드별 DpWidget 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   dp_widget 은 widget_lib_id → dp_widget_lib.path_id 로 간접 연결되어 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': lib path 없음 } */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(DpWidgetDto.Request req) {
        return dpWidgetRepository.selectPathTreeCntsByBizCd(req);
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
