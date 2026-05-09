package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveUsage;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmSaveUsageMapper;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveUsageRepository;
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
public class PmSaveUsageService {

    private final PmSaveUsageMapper pmSaveUsageMapper;
    private final PmSaveUsageRepository pmSaveUsageRepository;

    @PersistenceContext
    private EntityManager em;

    public PmSaveUsageDto.Item getById(String id) {
        PmSaveUsageDto.Item dto = pmSaveUsageMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PmSaveUsage findById(String id) {
        return pmSaveUsageRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pmSaveUsageRepository.existsById(id);
    }

    public List<PmSaveUsageDto.Item> getList(PmSaveUsageDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pmSaveUsageMapper.selectList(req);
    }

    public PmSaveUsageDto.PageResponse getPageData(PmSaveUsageDto.Request req) {
        PageHelper.addPaging(req);
        PmSaveUsageDto.PageResponse res = new PmSaveUsageDto.PageResponse();
        List<PmSaveUsageDto.Item> list = pmSaveUsageMapper.selectPageList(req);
        long count = pmSaveUsageMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PmSaveUsage create(PmSaveUsage body) {
        body.setSaveUsageId(CmUtil.generateId("pm_save_usage"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmSaveUsage saved = pmSaveUsageRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getSaveUsageId());
    }

    @Transactional
    public PmSaveUsage save(PmSaveUsage entity) {
        if (!existsById(entity.getSaveUsageId()))
            throw new CmBizException("존재하지 않는 PmSaveUsage입니다: " + entity.getSaveUsageId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveUsage saved = pmSaveUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getSaveUsageId());
    }

    @Transactional
    public PmSaveUsage update(String id, PmSaveUsage body) {
        PmSaveUsage entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "saveUsageId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveUsage saved = pmSaveUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PmSaveUsage updatePartial(PmSaveUsage entity) {
        if (entity.getSaveUsageId() == null) throw new CmBizException("saveUsageId 가 필요합니다.");
        if (!existsById(entity.getSaveUsageId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSaveUsageId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmSaveUsageMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getSaveUsageId());
    }

    @Transactional
    public void delete(String id) {
        PmSaveUsage entity = findById(id);
        pmSaveUsageRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PmSaveUsage> saveList(List<PmSaveUsage> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSaveUsageId() != null)
            .map(PmSaveUsage::getSaveUsageId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmSaveUsageRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PmSaveUsage> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSaveUsageId() != null)
            .toList();
        for (PmSaveUsage row : updateRows) {
            PmSaveUsage entity = findById(row.getSaveUsageId());
            VoUtil.voCopyExclude(row, entity, "saveUsageId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmSaveUsageRepository.save(entity);
            upsertedIds.add(entity.getSaveUsageId());
        }
        em.flush();

        List<PmSaveUsage> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmSaveUsage row : insertRows) {
            row.setSaveUsageId(CmUtil.generateId("pm_save_usage"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmSaveUsageRepository.save(row);
            upsertedIds.add(row.getSaveUsageId());
        }
        em.flush();
        em.clear();

        List<PmSaveUsage> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
