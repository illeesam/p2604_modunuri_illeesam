package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftIssue;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmGiftIssueMapper;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PmGiftIssueService {

    private final PmGiftIssueMapper pmGiftIssueMapper;
    private final PmGiftIssueRepository pmGiftIssueRepository;

    @PersistenceContext
    private EntityManager em;

    public PmGiftIssueDto.Item getById(String id) {
        PmGiftIssueDto.Item dto = pmGiftIssueMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmGiftIssue findById(String id) {
        return pmGiftIssueRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmGiftIssueRepository.existsById(id);
    }

    public List<PmGiftIssueDto.Item> getList(PmGiftIssueDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmGiftIssueMapper.selectList(VoUtil.voToMap(req));
    }

    public PmGiftIssueDto.PageResponse getPageData(PmGiftIssueDto.Request req) {
        PageHelper.addPaging(req);
        PmGiftIssueDto.PageResponse res = new PmGiftIssueDto.PageResponse();
        List<PmGiftIssueDto.Item> list = pmGiftIssueMapper.selectPageList(VoUtil.voToMap(req));
        long count = pmGiftIssueMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmGiftIssue create(PmGiftIssue body) {
        body.setGiftIssueId(CmUtil.generateId("pm_gift_issue"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmGiftIssue saved = pmGiftIssueRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmGiftIssue save(PmGiftIssue entity) {
        if (!existsById(entity.getGiftIssueId()))
            throw new CmBizException("존재하지 않는 PmGiftIssue입니다: " + entity.getGiftIssueId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGiftIssue saved = pmGiftIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmGiftIssue update(String id, PmGiftIssue body) {
        PmGiftIssue entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "giftIssueId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGiftIssue saved = pmGiftIssueRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PmGiftIssue updateSelective(PmGiftIssue entity) {
        if (entity.getGiftIssueId() == null) throw new CmBizException("giftIssueId 가 필요합니다.");
        if (!existsById(entity.getGiftIssueId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getGiftIssueId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmGiftIssueMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmGiftIssue entity = findById(id);
        pmGiftIssueRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

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
