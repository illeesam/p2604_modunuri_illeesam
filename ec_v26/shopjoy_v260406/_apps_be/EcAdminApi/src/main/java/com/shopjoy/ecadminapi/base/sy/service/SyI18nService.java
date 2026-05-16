package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.repository.SyI18nRepository;
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
public class SyI18nService {

    private final SyI18nRepository syI18nRepository;

    @PersistenceContext
    private EntityManager em;

    /* 다국어 키조회 */
    public SyI18nDto.Item getById(String id) {
        SyI18nDto.Item dto = syI18nRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyI18nDto.Item getByIdOrNull(String id) {
        return syI18nRepository.selectById(id).orElse(null);
    }

    /* 다국어 상세조회 */
    public SyI18n findById(String id) {
        return syI18nRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyI18n findByIdOrNull(String id) {
        return syI18nRepository.findById(id).orElse(null);
    }

    /* 다국어 키검증 */
    public boolean existsById(String id) {
        return syI18nRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syI18nRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 다국어 목록조회 */
    public List<SyI18nDto.Item> getList(SyI18nDto.Request req) {
        return syI18nRepository.selectList(req);
    }

    /* 다국어 페이지조회 */
    public SyI18nDto.PageResponse getPageData(SyI18nDto.Request req) {
        PageHelper.addPaging(req);
        return syI18nRepository.selectPageList(req);
    }

    /* 다국어 등록 */
    @Transactional
    public SyI18n create(SyI18n body) {
        body.setI18nId(CmUtil.generateId("sy_i18n"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyI18n saved = syI18nRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 다국어 저장 */
    @Transactional
    public SyI18n save(SyI18n entity) {
        if (!existsById(entity.getI18nId()))
            throw new CmBizException("존재하지 않는 SyI18n입니다: " + entity.getI18nId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyI18n saved = syI18nRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 다국어 수정 */
    @Transactional
    public SyI18n update(String id, SyI18n body) {
        SyI18n entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "i18nId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyI18n saved = syI18nRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 다국어 수정 */
    @Transactional
    public SyI18n updateSelective(SyI18n entity) {
        if (entity.getI18nId() == null) throw new CmBizException("i18nId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getI18nId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getI18nId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syI18nRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 다국어 삭제 */
    @Transactional
    public void delete(String id) {
        SyI18n entity = findById(id);
        syI18nRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 다국어 목록저장 */
    @Transactional
    public void saveList(List<SyI18n> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getI18nId() != null)
            .map(SyI18n::getI18nId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syI18nRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyI18n> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getI18nId() != null)
            .toList();
        for (SyI18n row : updateRows) {
            SyI18n entity = findById(row.getI18nId());
            VoUtil.voCopyExclude(row, entity, "i18nId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syI18nRepository.save(entity);
        }
        em.flush();

        List<SyI18n> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyI18n row : insertRows) {
            row.setI18nId(CmUtil.generateId("sy_i18n"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syI18nRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
