package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponIssueMapper;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PmCouponIssueService {

    private final PmCouponIssueMapper pmCouponIssueMapper;
    private final PmCouponIssueRepository pmCouponIssueRepository;

    @PersistenceContext
    private EntityManager em;

    public PmCouponIssueDto.Item getById(String id) {
        PmCouponIssueDto.Item dto = pmCouponIssueMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmCouponIssue findById(String id) {
        return pmCouponIssueRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmCouponIssueRepository.existsById(id);
    }

    public List<PmCouponIssueDto.Item> getList(PmCouponIssueDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmCouponIssueMapper.selectList(req);
    }

    public PmCouponIssueDto.PageResponse getPageData(PmCouponIssueDto.Request req) {
        PageHelper.addPaging(req);
        PmCouponIssueDto.PageResponse res = new PmCouponIssueDto.PageResponse();
        List<PmCouponIssueDto.Item> list = pmCouponIssueMapper.selectPageList(req);
        long count = pmCouponIssueMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmCouponIssue create(PmCouponIssue body) {
        body.setIssueId(CmUtil.generateId("pm_coupon_issue"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmCouponIssue saved = pmCouponIssueRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getIssueId());
    }

    @Transactional
    public PmCouponIssue save(PmCouponIssue entity) {
        if (!existsById(entity.getIssueId()))
            throw new CmBizException("존재하지 않는 PmCouponIssue입니다: " + entity.getIssueId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponIssue saved = pmCouponIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getIssueId());
    }

    @Transactional
    public PmCouponIssue update(String id, PmCouponIssue body) {
        PmCouponIssue entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "issueId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmCouponIssue saved = pmCouponIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PmCouponIssue updatePartial(PmCouponIssue entity) {
        if (entity.getIssueId() == null) throw new CmBizException("issueId 가 필요합니다.");
        if (!existsById(entity.getIssueId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getIssueId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmCouponIssueMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getIssueId());
    }

    @Transactional
    public void delete(String id) {
        PmCouponIssue entity = findById(id);
        pmCouponIssueRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PmCouponIssue> saveList(List<PmCouponIssue> rows) {
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

        List<String> upsertedIds = new ArrayList<>();
        List<PmCouponIssue> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getIssueId() != null)
            .toList();
        for (PmCouponIssue row : updateRows) {
            PmCouponIssue entity = findById(row.getIssueId());
            VoUtil.voCopyExclude(row, entity, "issueId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmCouponIssueRepository.save(entity);
            upsertedIds.add(entity.getIssueId());
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
            upsertedIds.add(row.getIssueId());
        }
        em.flush();
        em.clear();

        List<PmCouponIssue> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
