package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdTagRepository;
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
public class PdProdTagService {

    private final PdProdTagRepository pdProdTagRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdTagDto.Item getById(String id) {
        PdProdTagDto.Item dto = pdProdTagRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdTagDto.Item getByIdOrNull(String id) {
        return pdProdTagRepository.selectById(id).orElse(null);
    }

    public PdProdTag findById(String id) {
        return pdProdTagRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdTag findByIdOrNull(String id) {
        return pdProdTagRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pdProdTagRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdTagRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PdProdTagDto.Item> getList(PdProdTagDto.Request req) {
        return pdProdTagRepository.selectList(req);
    }

    public PdProdTagDto.PageResponse getPageData(PdProdTagDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdTagRepository.selectPageList(req);
    }

    @Transactional
    public PdProdTag create(PdProdTag body) {
        body.setProdTagId(CmUtil.generateId("pd_prod_tag"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdTag saved = pdProdTagRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdTag save(PdProdTag entity) {
        if (!existsById(entity.getProdTagId()))
            throw new CmBizException("존재하지 않는 PdProdTag입니다: " + entity.getProdTagId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdTag saved = pdProdTagRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdTag update(String id, PdProdTag body) {
        PdProdTag entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodTagId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdTag saved = pdProdTagRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdTag updateSelective(PdProdTag entity) {
        if (entity.getProdTagId() == null) throw new CmBizException("prodTagId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getProdTagId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdTagId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdTagRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdProdTag entity = findById(id);
        pdProdTagRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PdProdTag> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdTagId() != null)
            .map(PdProdTag::getProdTagId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdTagRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdProdTag> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getProdTagId() != null)
            .toList();
        for (PdProdTag row : updateRows) {
            PdProdTag entity = findById(row.getProdTagId());
            VoUtil.voCopyExclude(row, entity, "prodTagId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdTagRepository.save(entity);
        }
        em.flush();

        List<PdProdTag> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdTag row : insertRows) {
            row.setProdTagId(CmUtil.generateId("pd_prod_tag"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdTagRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
