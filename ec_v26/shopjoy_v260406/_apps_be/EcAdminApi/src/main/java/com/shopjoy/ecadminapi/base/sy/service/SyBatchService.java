package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBatchDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.repository.SyBatchRepository;
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
public class SyBatchService {

    private final SyBatchRepository syBatchRepository;

    @PersistenceContext
    private EntityManager em;

    public SyBatchDto.Item getById(String id) {
        SyBatchDto.Item dto = syBatchRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBatchDto.Item getByIdOrNull(String id) {
        return syBatchRepository.selectById(id).orElse(null);
    }

    public SyBatch findById(String id) {
        return syBatchRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBatch findByIdOrNull(String id) {
        return syBatchRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return syBatchRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syBatchRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<SyBatchDto.Item> getList(SyBatchDto.Request req) {
        return syBatchRepository.selectList(req);
    }

    public SyBatchDto.PageResponse getPageData(SyBatchDto.Request req) {
        PageHelper.addPaging(req);
        return syBatchRepository.selectPageList(req);
    }

    @Transactional
    public SyBatch create(SyBatch body) {
        body.setBatchId(CmUtil.generateId("sy_batch"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyBatch saved = syBatchRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyBatch save(SyBatch entity) {
        if (!existsById(entity.getBatchId()))
            throw new CmBizException("존재하지 않는 SyBatch입니다: " + entity.getBatchId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBatch saved = syBatchRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyBatch update(String id, SyBatch body) {
        SyBatch entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "batchId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBatch saved = syBatchRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyBatch updateSelective(SyBatch entity) {
        if (entity.getBatchId() == null) throw new CmBizException("batchId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBatchId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBatchId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syBatchRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyBatch entity = findById(id);
        syBatchRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<SyBatch> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBatchId() != null)
            .map(SyBatch::getBatchId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syBatchRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyBatch> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBatchId() != null)
            .toList();
        for (SyBatch row : updateRows) {
            SyBatch entity = findById(row.getBatchId());
            VoUtil.voCopyExclude(row, entity, "batchId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syBatchRepository.save(entity);
        }
        em.flush();

        List<SyBatch> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyBatch row : insertRows) {
            row.setBatchId(CmUtil.generateId("sy_batch"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syBatchRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
