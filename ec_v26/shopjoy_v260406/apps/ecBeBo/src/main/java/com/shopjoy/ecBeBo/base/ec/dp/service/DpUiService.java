package com.shopjoy.ecBeBo.base.ec.dp.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecBeBo.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecBeBo.base.ec.dp.repository.DpUiRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.PageHelper;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
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
public class DpUiService {

    private final DpUiRepository dpUiRepository;

    @PersistenceContext
    private EntityManager em;

    /* 전시 UI 키조회 */
    public DpUiDto.Item getById(String id) {
        // [QueryDSL] 디스플레이 UI (최상위 화면 정의) 단건 조회
        DpUiDto.Item dto = dpUiRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpUiDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 디스플레이 UI (최상위 화면 정의) 단건 조회
        return dpUiRepository.selectById(id).orElse(null);
    }

    /* 전시 UI 상세조회 */
    public DpUi findById(String id) {
        // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 단건 조회
        return dpUiRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public DpUi findByIdOrNull(String id) {
        // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 단건 조회
        return dpUiRepository.findById(id).orElse(null);
    }

    /* 전시 UI 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 존재 여부 확인
        return dpUiRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 존재 여부 확인
        if (!dpUiRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 전시 UI 목록조회 */
    public List<DpUiDto.Item> getList(DpUiDto.Request req) {
        // [QueryDSL] 디스플레이 UI (최상위 화면 정의) 목록 조회
        return dpUiRepository.selectList(req);
    }

    /* 전시 UI 페이지조회 */
    public BasePage<DpUiDto.Item> getPageData(DpUiDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 디스플레이 UI (최상위 화면 정의) 페이지 조회
        return dpUiRepository.selectPageData(req);
    }

    /* 전시 UI 등록 */
    @Transactional
    public DpUi create(DpUi body) {
        body.setUiId(CmUtil.generateId("dp_ui"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 저장
        DpUi saved = dpUiRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 전시 UI 수정 */
    @Transactional
    public DpUi update(String id, DpUi body) {
        CmUtil.requireId(id, "id", this);
        DpUi entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "uiId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 저장
        DpUi saved = dpUiRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 전시 UI 수정 */
    @Transactional
    public DpUi updateSelective(DpUi entity) {
        if (entity.getUiId() == null) throw new CmBizException("uiId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getUiId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getUiId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 디스플레이 UI (최상위 화면 정의) 선택적 필드 수정
        int affected = dpUiRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 전시 UI 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        DpUi entity = findById(id);
        // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 삭제
        dpUiRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public DpUi saveOneBase(DpUi entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getUiId());

        if ("D".equals(rowStatus)) {
            if (entity.getUiId() == null)
                throw new CmBizException("삭제 대상 uiId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 존재 여부 확인
            if (!dpUiRepository.existsById(entity.getUiId()))
                throw new CmBizException("존재하지 않는 DpUi입니다: " + entity.getUiId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) ID 기준 삭제
            dpUiRepository.deleteById(entity.getUiId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setUiId(CmUtil.generateId("dp_ui"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 저장
            DpUi saved = dpUiRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getUiId() == null)
                throw new CmBizException("수정 대상 uiId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 디스플레이 UI (최상위 화면 정의) 선택적 필드 수정
            int affected = dpUiRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 DpUi입니다: " + entity.getUiId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getUiId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<DpUi> rows) {
        /* 0단계: rowStatus 정규화 */
        for (DpUi row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getUiId() == null || row.getUiId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, DpUi::getUiId, "U", "uiId", this);
        CmUtil.requireRowIds(rows, DpUi::getUiId, "D", "uiId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(DpUi::getUiId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 조건별 삭제
            dpUiRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<DpUi> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (DpUi row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 디스플레이 UI (최상위 화면 정의) 선택적 필드 수정
            int affected = dpUiRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getUiId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<DpUi> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (DpUi row : insertRows) {
            row.setUiId(CmUtil.generateId("dp_ui"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 디스플레이 UI (최상위 화면 정의) 저장
            dpUiRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;
    }

    /** getPathTreeNodeCounts — 표시경로 노드별 DpUi 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(DpUiDto.Request req) {
        // [QueryDSL] 디스플레이 UI (최상위 화면 정의) 조회
        return dpUiRepository.selectPathTreeUiCnts(req);
    }
}
