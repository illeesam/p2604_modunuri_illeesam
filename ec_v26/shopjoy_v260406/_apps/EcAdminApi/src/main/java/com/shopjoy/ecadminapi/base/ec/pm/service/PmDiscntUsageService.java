package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmDiscntUsageMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntUsageRepository;
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
public class PmDiscntUsageService {

    private final PmDiscntUsageMapper pmDiscntUsageMapper;
    private final PmDiscntUsageRepository pmDiscntUsageRepository;

    @PersistenceContext
    private EntityManager em;

    public PmDiscntUsageDto.Item getById(String id) {
        PmDiscntUsageDto.Item dto = pmDiscntUsageMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmDiscntUsage findById(String id) {
        return pmDiscntUsageRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmDiscntUsageRepository.existsById(id);
    }

    public List<PmDiscntUsageDto.Item> getList(PmDiscntUsageDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmDiscntUsageMapper.selectList(req);
    }

    public PmDiscntUsageDto.PageResponse getPageData(PmDiscntUsageDto.Request req) {
        PageHelper.addPaging(req);
        PmDiscntUsageDto.PageResponse res = new PmDiscntUsageDto.PageResponse();
        List<PmDiscntUsageDto.Item> list = pmDiscntUsageMapper.selectPageList(req);
        long count = pmDiscntUsageMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmDiscntUsage create(PmDiscntUsage body) {
        body.setDiscntUsageId(CmUtil.generateId("pm_discnt_usage"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmDiscntUsage saved = pmDiscntUsageRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getDiscntUsageId());
    }

    @Transactional
    public PmDiscntUsage save(PmDiscntUsage entity) {
        if (!existsById(entity.getDiscntUsageId()))
            throw new CmBizException("존재하지 않는 PmDiscntUsage입니다: " + entity.getDiscntUsageId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscntUsage saved = pmDiscntUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getDiscntUsageId());
    }

    @Transactional
    public PmDiscntUsage update(String id, PmDiscntUsage body) {
        PmDiscntUsage entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "discntUsageId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscntUsage saved = pmDiscntUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PmDiscntUsage updatePartial(PmDiscntUsage entity) {
        if (entity.getDiscntUsageId() == null) throw new CmBizException("discntUsageId 가 필요합니다.");
        if (!existsById(entity.getDiscntUsageId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDiscntUsageId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmDiscntUsageMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getDiscntUsageId());
    }

    @Transactional
    public void delete(String id) {
        PmDiscntUsage entity = findById(id);
        pmDiscntUsageRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PmDiscntUsage> saveList(List<PmDiscntUsage> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDiscntUsageId() != null)
            .map(PmDiscntUsage::getDiscntUsageId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmDiscntUsageRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PmDiscntUsage> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDiscntUsageId() != null)
            .toList();
        for (PmDiscntUsage row : updateRows) {
            PmDiscntUsage entity = findById(row.getDiscntUsageId());
            VoUtil.voCopyExclude(row, entity, "discntUsageId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmDiscntUsageRepository.save(entity);
            upsertedIds.add(entity.getDiscntUsageId());
        }
        em.flush();

        List<PmDiscntUsage> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmDiscntUsage row : insertRows) {
            row.setDiscntUsageId(CmUtil.generateId("pm_discnt_usage"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmDiscntUsageRepository.save(row);
            upsertedIds.add(row.getDiscntUsageId());
        }
        em.flush();
        em.clear();

        List<PmDiscntUsage> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
