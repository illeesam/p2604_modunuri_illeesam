package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdContentDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdContentRepository;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PdProdContentService {

    private final PdProdContentRepository pdProdContentRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdContentDto.Item getById(String id) {
        PdProdContentDto.Item dto = pdProdContentRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdContentDto.Item getByIdOrNull(String id) {
        return pdProdContentRepository.selectById(id).orElse(null);
    }

    public PdProdContent findById(String id) {
        return pdProdContentRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdContent findByIdOrNull(String id) {
        return pdProdContentRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pdProdContentRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdContentRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PdProdContentDto.Item> getList(PdProdContentDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdContentRepository.selectList(req);
    }

    public PdProdContentDto.PageResponse getPageData(PdProdContentDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdContentRepository.selectPageList(req);
    }

    @Transactional
    public PdProdContent create(PdProdContent body) {
        body.setProdContentId(CmUtil.generateId("pd_prod_content"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdContent saved = pdProdContentRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdContent save(PdProdContent entity) {
        if (!existsById(entity.getProdContentId()))
            throw new CmBizException("존재하지 않는 PdProdContent입니다: " + entity.getProdContentId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdContent saved = pdProdContentRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdContent update(String id, PdProdContent body) {
        PdProdContent entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodContentId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdContent saved = pdProdContentRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdContent updateSelective(PdProdContent entity) {
        if (entity.getProdContentId() == null) throw new CmBizException("prodContentId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdContentId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdContentId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdContentRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdProdContent entity = findById(id);
        pdProdContentRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PdProdContent> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdContentId() != null)
            .map(PdProdContent::getProdContentId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdContentRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdProdContent> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getProdContentId() != null)
            .toList();
        for (PdProdContent row : updateRows) {
            PdProdContent entity = findById(row.getProdContentId());
            VoUtil.voCopyExclude(row, entity, "prodContentId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdContentRepository.save(entity);
        }
        em.flush();

        List<PdProdContent> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdContent row : insertRows) {
            row.setProdContentId(CmUtil.generateId("pd_prod_content"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdContentRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
