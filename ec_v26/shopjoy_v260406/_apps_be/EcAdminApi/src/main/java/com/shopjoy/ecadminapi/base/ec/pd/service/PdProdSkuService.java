package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdSku;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdSkuMapper;
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

    private final PdProdSkuMapper pdProdSkuMapper;
    private final PdProdSkuRepository pdProdSkuRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdSkuDto.Item getById(String id) {
        PdProdSkuDto.Item dto = pdProdSkuMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdProdSku findById(String id) {
        return pdProdSkuRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdProdSkuRepository.existsById(id);
    }

    public List<PdProdSkuDto.Item> getList(PdProdSkuDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdSkuMapper.selectList(VoUtil.voToMap(req));
    }

    public PdProdSkuDto.PageResponse getPageData(PdProdSkuDto.Request req) {
        PageHelper.addPaging(req);
        PdProdSkuDto.PageResponse res = new PdProdSkuDto.PageResponse();
        List<PdProdSkuDto.Item> list = pdProdSkuMapper.selectPageList(VoUtil.voToMap(req));
        long count = pdProdSkuMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdProdSku create(PdProdSku body) {
        body.setSkuId(CmUtil.generateId("pd_prod_sku"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProdSku saved = pdProdSkuRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdSku save(PdProdSku entity) {
        if (!existsById(entity.getSkuId()))
            throw new CmBizException("존재하지 않는 PdProdSku입니다: " + entity.getSkuId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProdSku saved = pdProdSkuRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
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
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdProdSku updateSelective(PdProdSku entity) {
        if (entity.getSkuId() == null) throw new CmBizException("skuId 가 필요합니다.");
        if (!existsById(entity.getSkuId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSkuId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdSkuMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdProdSku entity = findById(id);
        pdProdSkuRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
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
