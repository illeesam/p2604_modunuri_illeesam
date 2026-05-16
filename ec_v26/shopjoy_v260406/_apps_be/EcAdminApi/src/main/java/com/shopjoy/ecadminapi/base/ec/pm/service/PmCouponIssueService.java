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
        return pmCouponIssueRepository.selectPageList(req);
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

    /* 쿠폰 발행 저장 */
    @Transactional
    public PmCouponIssue save(PmCouponIssue entity) {
        if (!existsById(entity.getIssueId()))
            throw new CmBizException("존재하지 않는 PmCouponIssue입니다: " + entity.getIssueId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponIssue saved = pmCouponIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 쿠폰 발행 수정 */
    @Transactional
    public PmCouponIssue update(String id, PmCouponIssue body) {
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
        PmCouponIssue entity = findById(id);
        pmCouponIssueRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 쿠폰 발행 목록저장 */
    @Transactional
    public void saveList(List<PmCouponIssue> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getIssueId() != null)
            .map(PmCouponIssue::getIssueId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmCouponIssueRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmCouponIssue> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getIssueId() != null)
            .toList();
        for (PmCouponIssue row : updateRows) {
            PmCouponIssue entity = findById(row.getIssueId());
            VoUtil.voCopyExclude(row, entity, "issueId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmCouponIssueRepository.save(entity);
        }
        em.flush();

        List<PmCouponIssue> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmCouponIssue row : insertRows) {
            row.setIssueId(CmUtil.generateId("pm_coupon_issue"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmCouponIssueRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
