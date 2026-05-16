package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveUsage;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PmSaveUsageService {

    private final PmSaveUsageRepository pmSaveUsageRepository;

    @PersistenceContext
    private EntityManager em;

    /* 적립금 사용 이력 키조회 */
    public PmSaveUsageDto.Item getById(String id) {
        PmSaveUsageDto.Item dto = pmSaveUsageRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSaveUsageDto.Item getByIdOrNull(String id) {
        return pmSaveUsageRepository.selectById(id).orElse(null);
    }

    /* 적립금 사용 이력 상세조회 */
    public PmSaveUsage findById(String id) {
        return pmSaveUsageRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSaveUsage findByIdOrNull(String id) {
        return pmSaveUsageRepository.findById(id).orElse(null);
    }

    /* 적립금 사용 이력 키검증 */
    public boolean existsById(String id) {
        return pmSaveUsageRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmSaveUsageRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 적립금 사용 이력 목록조회 */
    public List<PmSaveUsageDto.Item> getList(PmSaveUsageDto.Request req) {
        return pmSaveUsageRepository.selectList(req);
    }

    /* 적립금 사용 이력 페이지조회 */
    public PmSaveUsageDto.PageResponse getPageData(PmSaveUsageDto.Request req) {
        PageHelper.addPaging(req);
        return pmSaveUsageRepository.selectPageList(req);
    }

    /* 적립금 사용 이력 등록 */
    @Transactional
    public PmSaveUsage create(PmSaveUsage body) {
        body.setSaveUsageId(CmUtil.generateId("pm_save_usage"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmSaveUsage saved = pmSaveUsageRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 적립금 사용 이력 저장 */
    @Transactional
    public PmSaveUsage save(PmSaveUsage entity) {
        if (!existsById(entity.getSaveUsageId()))
            throw new CmBizException("존재하지 않는 PmSaveUsage입니다: " + entity.getSaveUsageId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveUsage saved = pmSaveUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 적립금 사용 이력 수정 */
    @Transactional
    public PmSaveUsage update(String id, PmSaveUsage body) {
        PmSaveUsage entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "saveUsageId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSaveUsage saved = pmSaveUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 적립금 사용 이력 수정 */
    @Transactional
    public PmSaveUsage updateSelective(PmSaveUsage entity) {
        if (entity.getSaveUsageId() == null) throw new CmBizException("saveUsageId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSaveUsageId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSaveUsageId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmSaveUsageRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 적립금 사용 이력 삭제 */
    @Transactional
    public void delete(String id) {
        PmSaveUsage entity = findById(id);
        pmSaveUsageRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 적립금 사용 이력 목록저장 */
    @Transactional
    public void saveList(List<PmSaveUsage> rows) {
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
        List<PmSaveUsage> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSaveUsageId() != null)
            .toList();
        for (PmSaveUsage row : updateRows) {
            PmSaveUsage entity = findById(row.getSaveUsageId());
            VoUtil.voCopyExclude(row, entity, "saveUsageId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmSaveUsageRepository.save(entity);
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
        }
        em.flush();
        em.clear();
    }
}
