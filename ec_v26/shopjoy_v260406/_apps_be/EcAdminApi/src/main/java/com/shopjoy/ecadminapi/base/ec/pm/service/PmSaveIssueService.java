package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveIssueRepository;
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
public class PmSaveIssueService {

    private final PmSaveIssueRepository pmSaveIssueRepository;

    @PersistenceContext
    private EntityManager em;

    public PmSaveIssueDto.Item getById(String id) {
        PmSaveIssueDto.Item dto = pmSaveIssueRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSaveIssueDto.Item getByIdOrNull(String id) {
        return pmSaveIssueRepository.selectById(id).orElse(null);
    }

    public PmSaveIssue findById(String id) {
        return pmSaveIssueRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSaveIssue findByIdOrNull(String id) {
        return pmSaveIssueRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pmSaveIssueRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmSaveIssueRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PmSaveIssueDto.Item> getList(PmSaveIssueDto.Request req) {
        return pmSaveIssueRepository.selectList(req);
    }

    public PmSaveIssueDto.PageResponse getPageData(PmSaveIssueDto.Request req) {
        PageHelper.addPaging(req);
        return pmSaveIssueRepository.selectPageList(req);
    }

    @Transactional
    public PmSaveIssue create(PmSaveIssue body) {
        body.setSaveIssueId(CmUtil.generateId("pm_save_issue"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmSaveIssue saved = pmSaveIssueRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmSaveIssue save(PmSaveIssue entity) {
        if (!existsById(entity.getSaveIssueId()))
            throw new CmBizException("존재하지 않는 PmSaveIssue입니다: " + entity.getSaveIssueId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveIssue saved = pmSaveIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmSaveIssue update(String id, PmSaveIssue body) {
        PmSaveIssue entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "saveIssueId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveIssue saved = pmSaveIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmSaveIssue updateSelective(PmSaveIssue entity) {
        if (entity.getSaveIssueId() == null) throw new CmBizException("saveIssueId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSaveIssueId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSaveIssueId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmSaveIssueRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmSaveIssue entity = findById(id);
        pmSaveIssueRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PmSaveIssue> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSaveIssueId() != null)
            .map(PmSaveIssue::getSaveIssueId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmSaveIssueRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmSaveIssue> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSaveIssueId() != null)
            .toList();
        for (PmSaveIssue row : updateRows) {
            PmSaveIssue entity = findById(row.getSaveIssueId());
            VoUtil.voCopyExclude(row, entity, "saveIssueId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmSaveIssueRepository.save(entity);
        }
        em.flush();

        List<PmSaveIssue> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmSaveIssue row : insertRows) {
            row.setSaveIssueId(CmUtil.generateId("pm_save_issue"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmSaveIssueRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
