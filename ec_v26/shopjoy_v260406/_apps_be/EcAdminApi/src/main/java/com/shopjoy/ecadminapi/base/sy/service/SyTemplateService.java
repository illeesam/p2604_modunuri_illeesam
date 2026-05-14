package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.repository.SyTemplateRepository;
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
public class SyTemplateService {

    private final SyTemplateRepository syTemplateRepository;

    @PersistenceContext
    private EntityManager em;

    public SyTemplateDto.Item getById(String id) {
        SyTemplateDto.Item dto = syTemplateRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyTemplateDto.Item getByIdOrNull(String id) {
        return syTemplateRepository.selectById(id).orElse(null);
    }

    public SyTemplate findById(String id) {
        return syTemplateRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyTemplate findByIdOrNull(String id) {
        return syTemplateRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return syTemplateRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syTemplateRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<SyTemplateDto.Item> getList(SyTemplateDto.Request req) {
        return syTemplateRepository.selectList(req);
    }

    public SyTemplateDto.PageResponse getPageData(SyTemplateDto.Request req) {
        PageHelper.addPaging(req);
        return syTemplateRepository.selectPageList(req);
    }

    @Transactional
    public SyTemplate create(SyTemplate body) {
        body.setTemplateId(CmUtil.generateId("sy_template"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyTemplate saved = syTemplateRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyTemplate save(SyTemplate entity) {
        if (!existsById(entity.getTemplateId()))
            throw new CmBizException("존재하지 않는 SyTemplate입니다: " + entity.getTemplateId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyTemplate saved = syTemplateRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyTemplate update(String id, SyTemplate body) {
        SyTemplate entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "templateId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyTemplate saved = syTemplateRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public SyTemplate updateSelective(SyTemplate entity) {
        if (entity.getTemplateId() == null) throw new CmBizException("templateId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getTemplateId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getTemplateId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syTemplateRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        SyTemplate entity = findById(id);
        syTemplateRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<SyTemplate> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getTemplateId() != null)
            .map(SyTemplate::getTemplateId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syTemplateRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyTemplate> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getTemplateId() != null)
            .toList();
        for (SyTemplate row : updateRows) {
            SyTemplate entity = findById(row.getTemplateId());
            VoUtil.voCopyExclude(row, entity, "templateId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syTemplateRepository.save(entity);
        }
        em.flush();

        List<SyTemplate> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyTemplate row : insertRows) {
            row.setTemplateId(CmUtil.generateId("sy_template"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syTemplateRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
