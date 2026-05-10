package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdProdMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRepository;
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
public class PdProdService {

    private final PdProdMapper pdProdMapper;
    private final PdProdRepository pdProdRepository;

    @PersistenceContext
    private EntityManager em;

    public PdProdDto.Item getById(String id) {
        PdProdDto.Item dto = pdProdMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdProd findById(String id) {
        return pdProdRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdProdRepository.existsById(id);
    }

    public List<PdProdDto.Item> getList(PdProdDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdProdMapper.selectList(VoUtil.voToMap(req));
    }

    public PdProdDto.PageResponse getPageData(PdProdDto.Request req) {
        PageHelper.addPaging(req);
        PdProdDto.PageResponse res = new PdProdDto.PageResponse();
        List<PdProdDto.Item> list = pdProdMapper.selectPageList(VoUtil.voToMap(req));
        long count = pdProdMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdProd create(PdProd body) {
        body.setProdId(CmUtil.generateId("pd_prod"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdProd saved = pdProdRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdProd save(PdProd entity) {
        if (!existsById(entity.getProdId()))
            throw new CmBizException("존재하지 않는 PdProd입니다: " + entity.getProdId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProd saved = pdProdRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdProd update(String id, PdProd body) {
        PdProd entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdProd saved = pdProdRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdProd updatePartial(PdProd entity) {
        if (entity.getProdId() == null) throw new CmBizException("prodId 가 필요합니다.");
        if (!existsById(entity.getProdId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdProdMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdProd entity = findById(id);
        pdProdRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PdProd> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdId() != null)
            .map(PdProd::getProdId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdProdRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdProd> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getProdId() != null)
            .toList();
        for (PdProd row : updateRows) {
            PdProd entity = findById(row.getProdId());
            VoUtil.voCopyExclude(row, entity, "prodId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdProdRepository.save(entity);
        }
        em.flush();

        List<PdProd> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdProd row : insertRows) {
            row.setProdId(CmUtil.generateId("pd_prod"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdProdRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
