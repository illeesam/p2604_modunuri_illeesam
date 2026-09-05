package com.shopjoy.ecBeBo.base.ec.pm.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmGiftIssueDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmGiftIssue;
import com.shopjoy.ecBeBo.base.ec.pm.repository.PmGiftIssueRepository;
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
public class PmGiftIssueService {

    private final PmGiftIssueRepository pmGiftIssueRepository;

    @PersistenceContext
    private EntityManager em;

    /* 사은품 발행 이력 키조회 */
    public PmGiftIssueDto.Item getById(String id) {
        // [QueryDSL] 사은품 발급 단건 조회
        PmGiftIssueDto.Item dto = pmGiftIssueRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmGiftIssueDto.Item getByIdOrNull(String id) {
        // [QueryDSL] 사은품 발급 단건 조회
        return pmGiftIssueRepository.selectById(id).orElse(null);
    }

    /* 사은품 발행 이력 상세조회 */
    public PmGiftIssue findById(String id) {
        // [쿼리 메서드] 사은품 발급 단건 조회
        return pmGiftIssueRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmGiftIssue findByIdOrNull(String id) {
        // [쿼리 메서드] 사은품 발급 단건 조회
        return pmGiftIssueRepository.findById(id).orElse(null);
    }

    /* 사은품 발행 이력 키검증 */
    public boolean existsById(String id) {
        // [쿼리 메서드] 사은품 발급 존재 여부 확인
        return pmGiftIssueRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        // [쿼리 메서드] 사은품 발급 존재 여부 확인
        if (!pmGiftIssueRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 사은품 발행 이력 목록조회 */
    public List<PmGiftIssueDto.Item> getList(PmGiftIssueDto.Request req) {
        // [QueryDSL] 사은품 발급 목록 조회
        return pmGiftIssueRepository.selectList(req);
    }

    /* 사은품 발행 이력 페이지조회 */
    public BasePage<PmGiftIssueDto.Item> getPageData(PmGiftIssueDto.Request req) {
        PageHelper.addPaging(req);
        // [QueryDSL] 사은품 발급 페이지 조회
        return pmGiftIssueRepository.selectPageData(req);
    }

    /* 사은품 발행 이력 등록 */
    @Transactional
    public PmGiftIssue create(PmGiftIssue body) {
        body.setGiftIssueId(CmUtil.generateId("pm_gift_issue"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 사은품 발급 저장
        PmGiftIssue saved = pmGiftIssueRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 사은품 발행 이력 수정 */
    @Transactional
    public PmGiftIssue update(String id, PmGiftIssue body) {
        CmUtil.requireId(id, "id", this);
        PmGiftIssue entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "giftIssueId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 사은품 발급 저장
        PmGiftIssue saved = pmGiftIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 사은품 발행 이력 수정 */
    @Transactional
    public PmGiftIssue updateSelective(PmGiftIssue entity) {
        if (entity.getGiftIssueId() == null) throw new CmBizException("giftIssueId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getGiftIssueId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getGiftIssueId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [QueryDSL] 사은품 발급 선택적 필드 수정
        int affected = pmGiftIssueRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
        em.clear();
        return entity;
    }

    /* 사은품 발행 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmGiftIssue entity = findById(id);
        // [쿼리 메서드] 사은품 발급 삭제
        pmGiftIssueRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmGiftIssue saveOneBase(PmGiftIssue entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        rowStatus = entity.resolveRowStatus(entity.getGiftIssueId());

        if ("D".equals(rowStatus)) {
            if (entity.getGiftIssueId() == null)
                throw new CmBizException("삭제 대상 giftIssueId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 사은품 발급 존재 여부 확인
            if (!pmGiftIssueRepository.existsById(entity.getGiftIssueId()))
                throw new CmBizException("존재하지 않는 PmGiftIssue입니다: " + entity.getGiftIssueId() + "::" + CmUtil.svcCallerInfo(this));
            // [쿼리 메서드] 사은품 발급 ID 기준 삭제
            pmGiftIssueRepository.deleteById(entity.getGiftIssueId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setGiftIssueId(CmUtil.generateId("pm_gift_issue"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            // [쿼리 메서드] 사은품 발급 저장
            PmGiftIssue saved = pmGiftIssueRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getGiftIssueId() == null)
                throw new CmBizException("수정 대상 giftIssueId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            // [QueryDSL] 사은품 발급 선택적 필드 수정
            int affected = pmGiftIssueRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PmGiftIssue입니다: " + entity.getGiftIssueId() + "::" + CmUtil.svcCallerInfo(this));
            em.flush();   // clear() 전 필수 — 보류 중인 INSERT/UPDATE 가 clear 로 폐기되는 것 방지
            em.clear();
            return findById(entity.getGiftIssueId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmGiftIssue> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PmGiftIssue row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getGiftIssueId() == null || row.getGiftIssueId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmGiftIssue::getGiftIssueId, "U", "giftIssueId", this);
        CmUtil.requireRowIds(rows, PmGiftIssue::getGiftIssueId, "D", "giftIssueId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmGiftIssue::getGiftIssueId)
            .toList();
        if (!deleteIds.isEmpty()) {
            // [쿼리 메서드] 사은품 발급 조건별 삭제
            pmGiftIssueRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PmGiftIssue> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmGiftIssue row : updateRows) {
            row.setUpdBy(authId);
            // [QueryDSL] 사은품 발급 선택적 필드 수정
            int affected = pmGiftIssueRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getGiftIssueId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PmGiftIssue> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmGiftIssue row : insertRows) {
            row.setGiftIssueId(CmUtil.generateId("pm_gift_issue"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            // [쿼리 메서드] 사은품 발급 저장
            pmGiftIssueRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
