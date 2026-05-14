package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdSkuRepository;
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
public class PdProdSkuService {

    private final PdProdSkuRepository pdProdSkuRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdSkuDto.Item getById(String id) {
        PdProdSkuDto.Item dto = pdProdSkuRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdSkuDto.Item getByIdOrNull(String id) {
        return pdProdSkuRepository.selectById(id).orElse(null);
    }

    public PdProdSku findById(String id) {
        return pdProdSkuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdProdSku findByIdOrNull(String id) {
        return pdProdSkuRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return pdProdSkuRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdProdSkuRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<PdProdSkuDto.Item> getList(PdProdSkuDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdSkuRepository.selectList(req);
    }

    public PdProdSkuDto.PageResponse getPageData(PdProdSkuDto.Request req) {
        PageHelper.addPaging(req);
        return pdProdSkuRepository.selectPageList(req);
    }

    @Transactional
    public PdProdSku create(PdProdSku body) {
        body.setSkuId(CmUtil.generateId("pd_prod_sku"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdSku saved = pdProdSkuRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdSku save(PdProdSku entity) {
        if (!existsById(entity.getSkuId()))
            throw new CmBizException("존재하지 않는 PdProdSku입니다: " + entity.getSkuId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdSku saved = pdProdSkuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdSku update(String id, PdProdSku body) {
        PdProdSku entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "skuId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdSku saved = pdProdSkuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdSku updateSelective(PdProdSku entity) {
        if (entity.getSkuId() == null) throw new CmBizException("skuId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getSkuId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSkuId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdSkuRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdProdSku entity = findById(id);
        pdProdSkuRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<PdProdSku> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSkuId() != null)
            .map(PdProdSku::getSkuId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdSkuRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdProdSku> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSkuId() != null)
            .toList();
        for (PdProdSku row : updateRows) {
            PdProdSku entity = findById(row.getSkuId());
            VoUtil.voCopyExclude(row, entity, "skuId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdSkuRepository.save(entity);
        }
        em.flush();

        List<PdProdSku> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProdSku row : insertRows) {
            row.setSkuId(CmUtil.generateId("pd_prod_sku"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdSkuRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
