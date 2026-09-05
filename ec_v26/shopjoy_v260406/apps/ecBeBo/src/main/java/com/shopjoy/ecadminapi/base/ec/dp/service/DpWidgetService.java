package com.shopjoy.ecadminapi.base.ec.dp.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
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
        // [QueryDSL] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 단건 조회
        DpWidgetDto.Item dto = dpWidgetRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpWidgetDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 단건 조회
        return dpWidgetRepository.selectById(id).orElse(null);
    }

    /* 전시 위젯 상세조회 */
    public DpWidget findById(String id) {
        // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 단건 조회
        return dpWidgetRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpWidget findByIdOrNull(String id) {
        // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 단건 조회
        return dpWidgetRepository.findById(id).orElse(null);
    }

    /* 전시 위젯 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 존재 여부 확인
        return dpWidgetRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 존재 여부 확인
        if (!dpWidgetRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 전시 위젯 목록조회 */
    public List<DpWidgetDto.Item> getList(DpWidgetDto.Request req) {
        // [QueryDSL] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 목록 조회
        return dpWidgetRepository.selectList(req);
    }

    /* 전시 위젯 페이지조회 */
    public BasePage<DpWidgetDto.Item> getPageData(DpWidgetDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 페이지 조회
        return dpWidgetRepository.selectPageData(req);
    }

    /* 전시 위젯 등록 */
    @Transactional
    public DpWidget create(DpWidget body) {
        body.setWidgetId(CmUtil.generateId("dp_widget"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 저장
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
        // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 저장
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
        // [QueryDSL] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 선택적 필드 수정
        int affected = dpWidgetRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 전시 위젯 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        DpWidget entity = findById(id);
        // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 삭제
        dpWidgetRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public DpWidget saveOneBase(DpWidget entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getWidgetId());

        if ("D".equals(rowStatus)) {
            if (entity.getWidgetId() == null)
                throw new CmBizException("삭제 대상 widgetId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 존재 여부 확인
            if (!dpWidgetRepository.existsById(entity.getWidgetId()))
                throw new CmBizException("존재하지 않는 DpWidget입니다: " + entity.getWidgetId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) ID 기준 삭제
            dpWidgetRepository.deleteById(entity.getWidgetId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setWidgetId(CmUtil.generateId("dp_widget"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 저장
            DpWidget saved = dpWidgetRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getWidgetId() == null)
                throw new CmBizException("수정 대상 widgetId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 선택적 필드 수정
            int affected = dpWidgetRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 DpWidget입니다: " + entity.getWidgetId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getWidgetId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<DpWidget> rows) {
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
            // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 조건별 삭제
            dpWidgetRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<DpWidget> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (DpWidget row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 선택적 필드 수정
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
            // [쿼리 메서드] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 저장
            dpWidgetRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;
    }

    /** getPathTreeNodeCounts — 표시경로 노드별 DpWidget 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   dp_widget 은 widget_lib_id → dp_widget_lib.path_id 로 간접 연결되어 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': lib path 없음 } */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(DpWidgetDto.Request req) {
        // [QueryDSL] 디스플레이 위젯 (라이브러리 참조 또는 직접 생성) 조회
        return dpWidgetRepository.selectPathTreeWidgetCnts(req);
    }
}
