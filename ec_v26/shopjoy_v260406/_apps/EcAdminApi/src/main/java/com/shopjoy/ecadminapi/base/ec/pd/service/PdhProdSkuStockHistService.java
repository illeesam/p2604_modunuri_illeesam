package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuStockHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuStockHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdSkuStockHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdSkuStockHistRepository;
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
public class PdhProdSkuStockHistService {

    private final PdhProdSkuStockHistMapper pdhProdSkuStockHistMapper;
    private final PdhProdSkuStockHistRepository pdhProdSkuStockHistRepository;

    @PersistenceContext
    private EntityManager em;

    public PdhProdSkuStockHistDto.Item getById(String id) {
        PdhProdSkuStockHistDto.Item dto = pdhProdSkuStockHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdhProdSkuStockHist findById(String id) {
        return pdhProdSkuStockHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdhProdSkuStockHistRepository.existsById(id);
    }

    public List<PdhProdSkuStockHistDto.Item> getList(PdhProdSkuStockHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdhProdSkuStockHistMapper.selectList(req);
    }

    public PdhProdSkuStockHistDto.PageResponse getPageData(PdhProdSkuStockHistDto.Request req) {
        PageHelper.addPaging(req);
        PdhProdSkuStockHistDto.PageResponse res = new PdhProdSkuStockHistDto.PageResponse();
        List<PdhProdSkuStockHistDto.Item> list = pdhProdSkuStockHistMapper.selectPageList(req);
        long count = pdhProdSkuStockHistMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdhProdSkuStockHist create(PdhProdSkuStockHist body) {
        body.setHistId(CmUtil.generateId("pdh_prod_sku_stock_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdSkuStockHist saved = pdhProdSkuStockHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getHistId());
    }

    @Transactional
    public PdhProdSkuStockHist save(PdhProdSkuStockHist entity) {
        if (!existsById(entity.getHistId()))
            throw new CmBizException("존재하지 않는 PdhProdSkuStockHist입니다: " + entity.getHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdSkuStockHist saved = pdhProdSkuStockHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getHistId());
    }

    @Transactional
    public PdhProdSkuStockHist update(String id, PdhProdSkuStockHist body) {
        PdhProdSkuStockHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "histId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdSkuStockHist saved = pdhProdSkuStockHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PdhProdSkuStockHist updatePartial(PdhProdSkuStockHist entity) {
        if (entity.getHistId() == null) throw new CmBizException("histId 가 필요합니다.");
        if (!existsById(entity.getHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdSkuStockHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getHistId());
    }

    @Transactional
    public void delete(String id) {
        PdhProdSkuStockHist entity = findById(id);
        pdhProdSkuStockHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PdhProdSkuStockHist> saveList(List<PdhProdSkuStockHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getHistId() != null)
            .map(PdhProdSkuStockHist::getHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdhProdSkuStockHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PdhProdSkuStockHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getHistId() != null)
            .toList();
        for (PdhProdSkuStockHist row : updateRows) {
            PdhProdSkuStockHist entity = findById(row.getHistId());
            VoUtil.voCopyExclude(row, entity, "histId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdhProdSkuStockHistRepository.save(entity);
            upsertedIds.add(entity.getHistId());
        }
        em.flush();

        List<PdhProdSkuStockHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdhProdSkuStockHist row : insertRows) {
            row.setHistId(CmUtil.generateId("pdh_prod_sku_stock_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdhProdSkuStockHistRepository.save(row);
            upsertedIds.add(row.getHistId());
        }
        em.flush();
        em.clear();

        List<PdhProdSkuStockHist> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
