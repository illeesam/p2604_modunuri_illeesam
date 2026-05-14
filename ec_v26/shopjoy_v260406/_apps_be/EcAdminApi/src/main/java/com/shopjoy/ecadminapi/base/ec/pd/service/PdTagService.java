package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdTagRepository;
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
public class PdTagService {

    private final PdTagRepository pdTagRepository;

    @PersistenceContext
    private EntityManager em;

    public PdTagDto.Item getById(String id) {
        PdTagDto.Item dto = pdTagRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdTagDto.Item getByIdOrNull(String id) {
        return pdTagRepository.selectById(id).orElse(null);
    }

    public PdTag findById(String id) {
        return pdTagRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdTag findByIdOrNull(String id) {
        return pdTagRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pdTagRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdTagRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PdTagDto.Item> getList(PdTagDto.Request req) {
        return pdTagRepository.selectList(req);
    }

    public PdTagDto.PageResponse getPageData(PdTagDto.Request req) {
        PageHelper.addPaging(req);
        return pdTagRepository.selectPageList(req);
    }

    @Transactional
    public PdTag create(PdTag body) {
        body.setTagId(CmUtil.generateId("pd_tag"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdTag saved = pdTagRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdTag save(PdTag entity) {
        if (!existsById(entity.getTagId()))
            throw new CmBizException("존재하지 않는 PdTag입니다: " + entity.getTagId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdTag saved = pdTagRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdTag update(String id, PdTag body) {
        PdTag entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "tagId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdTag saved = pdTagRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdTag updateSelective(PdTag entity) {
        if (entity.getTagId() == null) throw new CmBizException("tagId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getTagId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getTagId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdTagRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdTag entity = findById(id);
        pdTagRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PdTag> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getTagId() != null)
            .map(PdTag::getTagId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdTagRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdTag> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getTagId() != null)
            .toList();
        for (PdTag row : updateRows) {
            PdTag entity = findById(row.getTagId());
            VoUtil.voCopyExclude(row, entity, "tagId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdTagRepository.save(entity);
        }
        em.flush();

        List<PdTag> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdTag row : insertRows) {
            row.setTagId(CmUtil.generateId("pd_tag"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdTagRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
