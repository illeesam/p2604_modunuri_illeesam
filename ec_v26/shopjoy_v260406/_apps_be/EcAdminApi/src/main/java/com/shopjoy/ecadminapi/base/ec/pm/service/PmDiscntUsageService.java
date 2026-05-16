package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
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
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PmDiscntUsageService {

    private final PmDiscntUsageRepository pmDiscntUsageRepository;

    @PersistenceContext
    private EntityManager em;

    /* 할인 사용 이력 키조회 */
    public PmDiscntUsageDto.Item getById(String id) {
        PmDiscntUsageDto.Item dto = pmDiscntUsageRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmDiscntUsageDto.Item getByIdOrNull(String id) {
        return pmDiscntUsageRepository.selectById(id).orElse(null);
    }

    /* 할인 사용 이력 상세조회 */
    public PmDiscntUsage findById(String id) {
        return pmDiscntUsageRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmDiscntUsage findByIdOrNull(String id) {
        return pmDiscntUsageRepository.findById(id).orElse(null);
    }

    /* 할인 사용 이력 키검증 */
    public boolean existsById(String id) {
        return pmDiscntUsageRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmDiscntUsageRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 할인 사용 이력 목록조회 */
    public List<PmDiscntUsageDto.Item> getList(PmDiscntUsageDto.Request req) {
        return pmDiscntUsageRepository.selectList(req);
    }

    /* 할인 사용 이력 페이지조회 */
    public PmDiscntUsageDto.PageResponse getPageData(PmDiscntUsageDto.Request req) {
        PageHelper.addPaging(req);
        return pmDiscntUsageRepository.selectPageList(req);
    }

    /* 할인 사용 이력 등록 */
    @Transactional
    public PmDiscntUsage create(PmDiscntUsage body) {
        body.setDiscntUsageId(CmUtil.generateId("pm_discnt_usage"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmDiscntUsage saved = pmDiscntUsageRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 할인 사용 이력 저장 */
    @Transactional
    public PmDiscntUsage save(PmDiscntUsage entity) {
        if (!existsById(entity.getDiscntUsageId()))
            throw new CmBizException("존재하지 않는 PmDiscntUsage입니다: " + entity.getDiscntUsageId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscntUsage saved = pmDiscntUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 할인 사용 이력 수정 */
    @Transactional
    public PmDiscntUsage update(String id, PmDiscntUsage body) {
        PmDiscntUsage entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "discntUsageId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscntUsage saved = pmDiscntUsageRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 할인 사용 이력 수정 */
    @Transactional
    public PmDiscntUsage updateSelective(PmDiscntUsage entity) {
        if (entity.getDiscntUsageId() == null) throw new CmBizException("discntUsageId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDiscntUsageId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDiscntUsageId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmDiscntUsageRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 할인 사용 이력 삭제 */
    @Transactional
    public void delete(String id) {
        PmDiscntUsage entity = findById(id);
        pmDiscntUsageRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 할인 사용 이력 목록저장 */
    @Transactional
    public void saveList(List<PmDiscntUsage> rows) {
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
        List<PmDiscntUsage> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDiscntUsageId() != null)
            .toList();
        for (PmDiscntUsage row : updateRows) {
            PmDiscntUsage entity = findById(row.getDiscntUsageId());
            VoUtil.voCopyExclude(row, entity, "discntUsageId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmDiscntUsageRepository.save(entity);
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
        }
        em.flush();
        em.clear();
    }
}
