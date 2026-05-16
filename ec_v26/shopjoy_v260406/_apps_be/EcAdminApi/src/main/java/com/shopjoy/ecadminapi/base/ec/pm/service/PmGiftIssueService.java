package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmGiftIssueRepository;
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
public class PmGiftIssueService {

    private final PmGiftIssueRepository pmGiftIssueRepository;

    @PersistenceContext
    private EntityManager em;

    /* 사은품 발행 이력 키조회 */
    public PmGiftIssueDto.Item getById(String id) {
        PmGiftIssueDto.Item dto = pmGiftIssueRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmGiftIssueDto.Item getByIdOrNull(String id) {
        return pmGiftIssueRepository.selectById(id).orElse(null);
    }

    /* 사은품 발행 이력 상세조회 */
    public PmGiftIssue findById(String id) {
        return pmGiftIssueRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmGiftIssue findByIdOrNull(String id) {
        return pmGiftIssueRepository.findById(id).orElse(null);
    }

    /* 사은품 발행 이력 키검증 */
    public boolean existsById(String id) {
        return pmGiftIssueRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmGiftIssueRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 사은품 발행 이력 목록조회 */
    public List<PmGiftIssueDto.Item> getList(PmGiftIssueDto.Request req) {
        return pmGiftIssueRepository.selectList(req);
    }

    /* 사은품 발행 이력 페이지조회 */
    public PmGiftIssueDto.PageResponse getPageData(PmGiftIssueDto.Request req) {
        PageHelper.addPaging(req);
        return pmGiftIssueRepository.selectPageList(req);
    }

    /* 사은품 발행 이력 등록 */
    @Transactional
    public PmGiftIssue create(PmGiftIssue body) {
        body.setGiftIssueId(CmUtil.generateId("pm_gift_issue"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmGiftIssue saved = pmGiftIssueRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 사은품 발행 이력 저장 */
    @Transactional
    public PmGiftIssue save(PmGiftIssue entity) {
        if (!existsById(entity.getGiftIssueId()))
            throw new CmBizException("존재하지 않는 PmGiftIssue입니다: " + entity.getGiftIssueId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGiftIssue saved = pmGiftIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 사은품 발행 이력 수정 */
    @Transactional
    public PmGiftIssue update(String id, PmGiftIssue body) {
        PmGiftIssue entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "giftIssueId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
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
        int affected = pmGiftIssueRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 사은품 발행 이력 삭제 */
    @Transactional
    public void delete(String id) {
        PmGiftIssue entity = findById(id);
        pmGiftIssueRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 사은품 발행 이력 목록저장 */
    @Transactional
    public void saveList(List<PmGiftIssue> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getGiftIssueId() != null)
            .map(PmGiftIssue::getGiftIssueId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmGiftIssueRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmGiftIssue> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getGiftIssueId() != null)
            .toList();
        for (PmGiftIssue row : updateRows) {
            PmGiftIssue entity = findById(row.getGiftIssueId());
            VoUtil.voCopyExclude(row, entity, "giftIssueId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmGiftIssueRepository.save(entity);
        }
        em.flush();

        List<PmGiftIssue> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmGiftIssue row : insertRows) {
            row.setGiftIssueId(CmUtil.generateId("pm_gift_issue"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmGiftIssueRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
