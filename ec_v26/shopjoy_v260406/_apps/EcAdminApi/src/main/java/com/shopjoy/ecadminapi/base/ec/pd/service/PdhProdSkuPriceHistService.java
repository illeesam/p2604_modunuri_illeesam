package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuPriceHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuPriceHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdSkuPriceHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdSkuPriceHistRepository;
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
public class PdhProdSkuPriceHistService {

    private final PdhProdSkuPriceHistMapper pdhProdSkuPriceHistMapper;
    private final PdhProdSkuPriceHistRepository pdhProdSkuPriceHistRepository;

    @PersistenceContext
    private EntityManager em;

    public PdhProdSkuPriceHistDto.Item getById(String id) {
        PdhProdSkuPriceHistDto.Item dto = pdhProdSkuPriceHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdhProdSkuPriceHist findById(String id) {
        return pdhProdSkuPriceHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdhProdSkuPriceHistRepository.existsById(id);
    }

    public List<PdhProdSkuPriceHistDto.Item> getList(PdhProdSkuPriceHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdhProdSkuPriceHistMapper.selectList(req);
    }

    public PdhProdSkuPriceHistDto.PageResponse getPageData(PdhProdSkuPriceHistDto.Request req) {
        PageHelper.addPaging(req);
        PdhProdSkuPriceHistDto.PageResponse res = new PdhProdSkuPriceHistDto.PageResponse();
        List<PdhProdSkuPriceHistDto.Item> list = pdhProdSkuPriceHistMapper.selectPageList(req);
        long count = pdhProdSkuPriceHistMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdhProdSkuPriceHist create(PdhProdSkuPriceHist body) {
        body.setHistId(CmUtil.generateId("pdh_prod_sku_price_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdSkuPriceHist saved = pdhProdSkuPriceHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getHistId());
    }

    @Transactional
    public PdhProdSkuPriceHist save(PdhProdSkuPriceHist entity) {
        if (!existsById(entity.getHistId()))
            throw new CmBizException("존재하지 않는 PdhProdSkuPriceHist입니다: " + entity.getHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdSkuPriceHist saved = pdhProdSkuPriceHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getHistId());
    }

    @Transactional
    public PdhProdSkuPriceHist update(String id, PdhProdSkuPriceHist body) {
        PdhProdSkuPriceHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "histId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdSkuPriceHist saved = pdhProdSkuPriceHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PdhProdSkuPriceHist updatePartial(PdhProdSkuPriceHist entity) {
        if (entity.getHistId() == null) throw new CmBizException("histId 가 필요합니다.");
        if (!existsById(entity.getHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdSkuPriceHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getHistId());
    }

    @Transactional
    public void delete(String id) {
        PdhProdSkuPriceHist entity = findById(id);
        pdhProdSkuPriceHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PdhProdSkuPriceHist> saveList(List<PdhProdSkuPriceHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getHistId() != null)
            .map(PdhProdSkuPriceHist::getHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdhProdSkuPriceHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PdhProdSkuPriceHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getHistId() != null)
            .toList();
        for (PdhProdSkuPriceHist row : updateRows) {
            PdhProdSkuPriceHist entity = findById(row.getHistId());
            VoUtil.voCopyExclude(row, entity, "histId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdhProdSkuPriceHistRepository.save(entity);
            upsertedIds.add(entity.getHistId());
        }
        em.flush();

        List<PdhProdSkuPriceHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdhProdSkuPriceHist row : insertRows) {
            row.setHistId(CmUtil.generateId("pdh_prod_sku_price_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdhProdSkuPriceHistRepository.save(row);
            upsertedIds.add(row.getHistId());
        }
        em.flush();
        em.clear();

        List<PdhProdSkuPriceHist> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
