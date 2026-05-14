package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmVoucherIssueRepository;
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
public class PmVoucherIssueService {

    private final PmVoucherIssueRepository pmVoucherIssueRepository;

    @PersistenceContext
    private EntityManager em;

    public PmVoucherIssueDto.Item getById(String id) {
        PmVoucherIssueDto.Item dto = pmVoucherIssueRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmVoucherIssueDto.Item getByIdOrNull(String id) {
        return pmVoucherIssueRepository.selectById(id).orElse(null);
    }

    public PmVoucherIssue findById(String id) {
        return pmVoucherIssueRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmVoucherIssue findByIdOrNull(String id) {
        return pmVoucherIssueRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pmVoucherIssueRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmVoucherIssueRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PmVoucherIssueDto.Item> getList(PmVoucherIssueDto.Request req) {
        return pmVoucherIssueRepository.selectList(req);
    }

    public PmVoucherIssueDto.PageResponse getPageData(PmVoucherIssueDto.Request req) {
        PageHelper.addPaging(req);
        return pmVoucherIssueRepository.selectPageList(req);
    }

    @Transactional
    public PmVoucherIssue create(PmVoucherIssue body) {
        body.setVoucherIssueId(CmUtil.generateId("pm_voucher_issue"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmVoucherIssue saved = pmVoucherIssueRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmVoucherIssue save(PmVoucherIssue entity) {
        if (!existsById(entity.getVoucherIssueId()))
            throw new CmBizException("존재하지 않는 PmVoucherIssue입니다: " + entity.getVoucherIssueId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmVoucherIssue saved = pmVoucherIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmVoucherIssue update(String id, PmVoucherIssue body) {
        PmVoucherIssue entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "voucherIssueId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmVoucherIssue saved = pmVoucherIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmVoucherIssue updateSelective(PmVoucherIssue entity) {
        if (entity.getVoucherIssueId() == null) throw new CmBizException("voucherIssueId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getVoucherIssueId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVoucherIssueId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmVoucherIssueRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmVoucherIssue entity = findById(id);
        pmVoucherIssueRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PmVoucherIssue> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getVoucherIssueId() != null)
            .map(PmVoucherIssue::getVoucherIssueId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmVoucherIssueRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmVoucherIssue> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getVoucherIssueId() != null)
            .toList();
        for (PmVoucherIssue row : updateRows) {
            PmVoucherIssue entity = findById(row.getVoucherIssueId());
            VoUtil.voCopyExclude(row, entity, "voucherIssueId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmVoucherIssueRepository.save(entity);
        }
        em.flush();

        List<PmVoucherIssue> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmVoucherIssue row : insertRows) {
            row.setVoucherIssueId(CmUtil.generateId("pm_voucher_issue"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmVoucherIssueRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
