package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntRepository;
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
public class PmDiscntService {

    private final PmDiscntRepository pmDiscntRepository;

    @PersistenceContext
    private EntityManager em;

    public PmDiscntDto.Item getById(String id) {
        PmDiscntDto.Item dto = pmDiscntRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmDiscntDto.Item getByIdOrNull(String id) {
        return pmDiscntRepository.selectById(id).orElse(null);
    }

    public PmDiscnt findById(String id) {
        return pmDiscntRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmDiscnt findByIdOrNull(String id) {
        return pmDiscntRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pmDiscntRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmDiscntRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PmDiscntDto.Item> getList(PmDiscntDto.Request req) {
        return pmDiscntRepository.selectList(req);
    }

    public PmDiscntDto.PageResponse getPageData(PmDiscntDto.Request req) {
        PageHelper.addPaging(req);
        return pmDiscntRepository.selectPageList(req);
    }

    @Transactional
    public PmDiscnt create(PmDiscnt body) {
        body.setDiscntId(CmUtil.generateId("pm_discnt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmDiscnt saved = pmDiscntRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmDiscnt save(PmDiscnt entity) {
        if (!existsById(entity.getDiscntId()))
            throw new CmBizException("존재하지 않는 PmDiscnt입니다: " + entity.getDiscntId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscnt saved = pmDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmDiscnt update(String id, PmDiscnt body) {
        PmDiscnt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "discntId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscnt saved = pmDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PmDiscnt updateSelective(PmDiscnt entity) {
        if (entity.getDiscntId() == null) throw new CmBizException("discntId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getDiscntId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDiscntId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmDiscntRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PmDiscnt entity = findById(id);
        pmDiscntRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PmDiscnt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDiscntId() != null)
            .map(PmDiscnt::getDiscntId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pmDiscntRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PmDiscnt> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDiscntId() != null)
            .toList();
        for (PmDiscnt row : updateRows) {
            PmDiscnt entity = findById(row.getDiscntId());
            VoUtil.voCopyExclude(row, entity, "discntId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pmDiscntRepository.save(entity);
        }
        em.flush();

        List<PmDiscnt> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PmDiscnt row : insertRows) {
            row.setDiscntId(CmUtil.generateId("pm_discnt"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pmDiscntRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
