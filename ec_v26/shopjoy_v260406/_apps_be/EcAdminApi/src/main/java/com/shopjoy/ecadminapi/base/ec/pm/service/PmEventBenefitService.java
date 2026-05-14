package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventBenefitDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventBenefitRepository;
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
public class PmEventBenefitService {

    private final PmEventBenefitRepository pmEventBenefitRepository;

    @PersistenceContext
    private EntityManager em;

    public PmEventBenefitDto.Item getById(String id) {
        PmEventBenefitDto.Item dto = pmEventBenefitRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmEventBenefitDto.Item getByIdOrNull(String id) {
        return pmEventBenefitRepository.selectById(id).orElse(null);
    }

    public PmEventBenefit findById(String id) {
        return pmEventBenefitRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmEventBenefit findByIdOrNull(String id) {
        return pmEventBenefitRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pmEventBenefitRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmEventBenefitRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PmEventBenefitDto.Item> getList(PmEventBenefitDto.Request req) {
        return pmEventBenefitRepository.selectList(req);
    }

    public PmEventBenefitDto.PageResponse getPageData(PmEventBenefitDto.Request req) {
        PageHelper.addPaging(req);
        return pmEventBenefitRepository.selectPageList(req);
    }

    @Transactional
    public PmEventBenefit create(PmEventBenefit body) {
        body.setBenefitId(CmUtil.generateId("pm_event_benefit"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmEventBenefit saved = pmEventBenefitRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmEventBenefit save(PmEventBenefit entity) {
        if (!existsById(entity.getBenefitId()))
            throw new CmBizException("존재하지 않는 PmEventBenefit입니다: " + entity.getBenefitId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmEventBenefit saved = pmEventBenefitRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmEventBenefit update(String id, PmEventBenefit body) {
        PmEventBenefit entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "benefitId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmEventBenefit saved = pmEventBenefitRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmEventBenefit updateSelective(PmEventBenefit entity) {
        if (entity.getBenefitId() == null) throw new CmBizException("benefitId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBenefitId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBenefitId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmEventBenefitRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmEventBenefit entity = findById(id);
        pmEventBenefitRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PmEventBenefit> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBenefitId() != null)
            .map(PmEventBenefit::getBenefitId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmEventBenefitRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmEventBenefit> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBenefitId() != null)
            .toList();
        for (PmEventBenefit row : updateRows) {
            PmEventBenefit entity = findById(row.getBenefitId());
            VoUtil.voCopyExclude(row, entity, "benefitId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmEventBenefitRepository.save(entity);
        }
        em.flush();

        List<PmEventBenefit> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmEventBenefit row : insertRows) {
            row.setBenefitId(CmUtil.generateId("pm_event_benefit"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmEventBenefitRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
