package com.shopjoy.ecBeBo.base.ec.pm.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmSaveIssueDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmSaveIssue;
import com.shopjoy.ecBeBo.base.ec.pm.repository.PmSaveIssueRepository;
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
public class PmSaveIssueService {

    private final PmSaveIssueRepository pmSaveIssueRepository;

    @PersistenceContext
    private EntityManager em;

    /* 적립금 지급 이력 키조회 */
    public PmSaveIssueDto.Item getById(String id) {
        // [QueryDSL] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 단건 조회
        PmSaveIssueDto.Item dto = pmSaveIssueRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSaveIssueDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 단건 조회
        return pmSaveIssueRepository.selectById(id).orElse(null);
    }

    /* 적립금 지급 이력 상세조회 */
    public PmSaveIssue findById(String id) {
        // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 단건 조회
        return pmSaveIssueRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSaveIssue findByIdOrNull(String id) {
        // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 단건 조회
        return pmSaveIssueRepository.findById(id).orElse(null);
    }

    /* 적립금 지급 이력 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 존재 여부 확인
        return pmSaveIssueRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 존재 여부 확인
        if (!pmSaveIssueRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 적립금 지급 이력 목록조회 */
    public List<PmSaveIssueDto.Item> getList(PmSaveIssueDto.Request req) {
        // [QueryDSL] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 목록 조회
        return pmSaveIssueRepository.selectList(req);
    }

    /* 적립금 지급 이력 페이지조회 */
    public BasePage<PmSaveIssueDto.Item> getPageData(PmSaveIssueDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 페이지 조회
        return pmSaveIssueRepository.selectPageData(req);
    }

    /* 적립금 지급 이력 등록 */
    @Transactional
    public PmSaveIssue create(PmSaveIssue body) {
        body.setSaveIssueId(CmUtil.generateId("pm_save_issue"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 저장
        PmSaveIssue saved = pmSaveIssueRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 적립금 지급 이력 수정 */
    @Transactional
    public PmSaveIssue update(String id, PmSaveIssue body) {
        CmUtil.requireId(id, "id", this);
        PmSaveIssue entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "saveIssueId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 저장
        PmSaveIssue saved = pmSaveIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 적립금 지급 이력 수정 */
    @Transactional
    public PmSaveIssue updateSelective(PmSaveIssue entity) {
        if (entity.getSaveIssueId() == null) throw new CmBizException("saveIssueId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSaveIssueId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSaveIssueId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 선택적 필드 수정
        int affected = pmSaveIssueRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 적립금 지급 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmSaveIssue entity = findById(id);
        // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 삭제
        pmSaveIssueRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmSaveIssue saveOneBase(PmSaveIssue entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getSaveIssueId());

        if ("D".equals(rowStatus)) {
            if (entity.getSaveIssueId() == null)
                throw new CmBizException("삭제 대상 saveIssueId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 존재 여부 확인
            if (!pmSaveIssueRepository.existsById(entity.getSaveIssueId()))
                throw new CmBizException("존재하지 않는 PmSaveIssue입니다: " + entity.getSaveIssueId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) ID 기준 삭제
            pmSaveIssueRepository.deleteById(entity.getSaveIssueId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setSaveIssueId(CmUtil.generateId("pm_save_issue"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 저장
            PmSaveIssue saved = pmSaveIssueRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getSaveIssueId() == null)
                throw new CmBizException("수정 대상 saveIssueId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 선택적 필드 수정
            int affected = pmSaveIssueRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PmSaveIssue입니다: " + entity.getSaveIssueId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getSaveIssueId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmSaveIssue> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PmSaveIssue row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getSaveIssueId() == null || row.getSaveIssueId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmSaveIssue::getSaveIssueId, "U", "saveIssueId", this);
        CmUtil.requireRowIds(rows, PmSaveIssue::getSaveIssueId, "D", "saveIssueId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmSaveIssue::getSaveIssueId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 조건별 삭제
            pmSaveIssueRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PmSaveIssue> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmSaveIssue row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 선택적 필드 수정
            int affected = pmSaveIssueRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getSaveIssueId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PmSaveIssue> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmSaveIssue row : insertRows) {
            row.setSaveIssueId(CmUtil.generateId("pm_save_issue"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 적립금 지급 이력 (구매적립/이벤트/리뷰/관리자 등) 저장
            pmSaveIssueRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
