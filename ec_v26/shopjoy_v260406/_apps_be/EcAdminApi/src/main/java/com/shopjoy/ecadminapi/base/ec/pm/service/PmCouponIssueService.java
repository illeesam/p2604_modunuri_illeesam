package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponIssueRepository;
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
public class PmCouponIssueService {

    private final PmCouponIssueRepository pmCouponIssueRepository;

    @PersistenceContext
    private EntityManager em;

    /* 쿠폰 발행 키조회 */
    public PmCouponIssueDto.Item getById(String id) {
        PmCouponIssueDto.Item dto = pmCouponIssueRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCouponIssueDto.Item getByIdOrNull(String id) {
        return pmCouponIssueRepository.selectById(id).orElse(null);
    }

    /* 쿠폰 발행 상세조회 */
    public PmCouponIssue findById(String id) {
        return pmCouponIssueRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmCouponIssue findByIdOrNull(String id) {
        return pmCouponIssueRepository.findById(id).orElse(null);
    }

    /* 쿠폰 발행 키검증 */
    public boolean existsById(String id) {
        return pmCouponIssueRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmCouponIssueRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 쿠폰 발행 목록조회 */
    public List<PmCouponIssueDto.Item> getList(PmCouponIssueDto.Request req) {
        return pmCouponIssueRepository.selectList(req);
    }

    /* 쿠폰 발행 페이지조회 */
    public PmCouponIssueDto.PageResponse getPageData(PmCouponIssueDto.Request req) {
        PageHelper.addPaging(req);
        return pmCouponIssueRepository.selectPageData(req);
    }

    /* 쿠폰 발행 등록 */
    @Transactional
    public PmCouponIssue create(PmCouponIssue body) {
        body.setIssueId(CmUtil.generateId("pm_coupon_issue"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmCouponIssue saved = pmCouponIssueRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 쿠폰 발행 수정 */
    @Transactional
    public PmCouponIssue update(String id, PmCouponIssue body) {
        CmUtil.requireId(id, "id", this);
        PmCouponIssue entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "issueId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponIssue saved = pmCouponIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 쿠폰 발행 수정 */
    @Transactional
    public PmCouponIssue updateSelective(PmCouponIssue entity) {
        if (entity.getIssueId() == null) throw new CmBizException("issueId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getIssueId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getIssueId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmCouponIssueRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 쿠폰 발행 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmCouponIssue entity = findById(id);
        pmCouponIssueRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmCouponIssue saveOneBase(PmCouponIssue entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getIssueId() == null || entity.getIssueId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getIssueId() == null)
                throw new CmBizException("삭제 대상 issueId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!pmCouponIssueRepository.existsById(entity.getIssueId()))
                throw new CmBizException("존재하지 않는 PmCouponIssue입니다: " + entity.getIssueId() + "::" + CmUtil.svcCallerInfo(this));
            pmCouponIssueRepository.deleteById(entity.getIssueId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setIssueId(CmUtil.generateId("pm_coupon_issue"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            PmCouponIssue saved = pmCouponIssueRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getIssueId() == null)
                throw new CmBizException("수정 대상 issueId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = pmCouponIssueRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 PmCouponIssue입니다: " + entity.getIssueId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getIssueId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<PmCouponIssue> rows) {
        /* 0단계: rowStatus 정규화 */
        for (PmCouponIssue row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getIssueId() == null || row.getIssueId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, PmCouponIssue::getIssueId, "U", "issueId", this);
        CmUtil.requireRowIds(rows, PmCouponIssue::getIssueId, "D", "issueId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(PmCouponIssue::getIssueId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmCouponIssueRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<PmCouponIssue> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (PmCouponIssue row : updateRows) {
            row.setUpdBy(authId);
            int affected = pmCouponIssueRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getIssueId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<PmCouponIssue> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmCouponIssue row : insertRows) {
            row.setIssueId(CmUtil.generateId("pm_coupon_issue"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmCouponIssueRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
