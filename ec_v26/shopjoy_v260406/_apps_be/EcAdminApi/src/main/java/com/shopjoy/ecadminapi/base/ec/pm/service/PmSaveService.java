package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmSaveRepository;
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
public class PmSaveService {

    private final PmSaveRepository pmSaveRepository;

    @PersistenceContext
    private EntityManager em;

    public PmSaveDto.Item getById(String id) {
        PmSaveDto.Item dto = pmSaveRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSaveDto.Item getByIdOrNull(String id) {
        return pmSaveRepository.selectById(id).orElse(null);
    }

    public PmSave findById(String id) {
        return pmSaveRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmSave findByIdOrNull(String id) {
        return pmSaveRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pmSaveRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmSaveRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PmSaveDto.Item> getList(PmSaveDto.Request req) {
        return pmSaveRepository.selectList(req);
    }

    public PmSaveDto.PageResponse getPageData(PmSaveDto.Request req) {
        PageHelper.addPaging(req);
        return pmSaveRepository.selectPageList(req);
    }

    @Transactional
    public PmSave create(PmSave body) {
        body.setSaveId(CmUtil.generateId("pm_save"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmSave saved = pmSaveRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmSave save(PmSave entity) {
        if (!existsById(entity.getSaveId()))
            throw new CmBizException("존재하지 않는 PmSave입니다: " + entity.getSaveId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSave saved = pmSaveRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmSave update(String id, PmSave body) {
        PmSave entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "saveId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmSave saved = pmSaveRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmSave updateSelective(PmSave entity) {
        if (entity.getSaveId() == null) throw new CmBizException("saveId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSaveId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSaveId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmSaveRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmSave entity = findById(id);
        pmSaveRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PmSave> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSaveId() != null)
            .map(PmSave::getSaveId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmSaveRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmSave> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSaveId() != null)
            .toList();
        for (PmSave row : updateRows) {
            PmSave entity = findById(row.getSaveId());
            VoUtil.voCopyExclude(row, entity, "saveId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmSaveRepository.save(entity);
        }
        em.flush();

        List<PmSave> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmSave row : insertRows) {
            row.setSaveId(CmUtil.generateId("pm_save"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmSaveRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
