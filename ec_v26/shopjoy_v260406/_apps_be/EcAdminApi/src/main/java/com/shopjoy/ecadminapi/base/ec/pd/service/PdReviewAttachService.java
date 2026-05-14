package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdReviewAttachDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdReviewAttach;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdReviewAttachRepository;
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
public class PdReviewAttachService {

    private final PdReviewAttachRepository pdReviewAttachRepository;

    @PersistenceContext
    private EntityManager em;

    public PdReviewAttachDto.Item getById(String id) {
        PdReviewAttachDto.Item dto = pdReviewAttachRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdReviewAttachDto.Item getByIdOrNull(String id) {
        return pdReviewAttachRepository.selectById(id).orElse(null);
    }

    public PdReviewAttach findById(String id) {
        return pdReviewAttachRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdReviewAttach findByIdOrNull(String id) {
        return pdReviewAttachRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pdReviewAttachRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdReviewAttachRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PdReviewAttachDto.Item> getList(PdReviewAttachDto.Request req) {
        return pdReviewAttachRepository.selectList(req);
    }

    public PdReviewAttachDto.PageResponse getPageData(PdReviewAttachDto.Request req) {
        PageHelper.addPaging(req);
        return pdReviewAttachRepository.selectPageList(req);
    }

    @Transactional
    public PdReviewAttach create(PdReviewAttach body) {
        body.setReviewAttachId(CmUtil.generateId("pd_review_attach"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdReviewAttach saved = pdReviewAttachRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdReviewAttach save(PdReviewAttach entity) {
        if (!existsById(entity.getReviewAttachId()))
            throw new CmBizException("존재하지 않는 PdReviewAttach입니다: " + entity.getReviewAttachId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdReviewAttach saved = pdReviewAttachRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdReviewAttach update(String id, PdReviewAttach body) {
        PdReviewAttach entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "reviewAttachId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdReviewAttach saved = pdReviewAttachRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdReviewAttach updateSelective(PdReviewAttach entity) {
        if (entity.getReviewAttachId() == null) throw new CmBizException("reviewAttachId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getReviewAttachId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getReviewAttachId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdReviewAttachRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdReviewAttach entity = findById(id);
        pdReviewAttachRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PdReviewAttach> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getReviewAttachId() != null)
            .map(PdReviewAttach::getReviewAttachId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdReviewAttachRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdReviewAttach> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getReviewAttachId() != null)
            .toList();
        for (PdReviewAttach row : updateRows) {
            PdReviewAttach entity = findById(row.getReviewAttachId());
            VoUtil.voCopyExclude(row, entity, "reviewAttachId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdReviewAttachRepository.save(entity);
        }
        em.flush();

        List<PdReviewAttach> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdReviewAttach row : insertRows) {
            row.setReviewAttachId(CmUtil.generateId("pd_review_attach"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdReviewAttachRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
