package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdSkuChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdSkuChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdSkuChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdSkuChgHistRepository;
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
public class PdhProdSkuChgHistService {

    private final PdhProdSkuChgHistMapper pdhProdSkuChgHistMapper;
    private final PdhProdSkuChgHistRepository pdhProdSkuChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    public PdhProdSkuChgHistDto.Item getById(String id) {
        PdhProdSkuChgHistDto.Item dto = pdhProdSkuChgHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdhProdSkuChgHist findById(String id) {
        return pdhProdSkuChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdhProdSkuChgHistRepository.existsById(id);
    }

    public List<PdhProdSkuChgHistDto.Item> getList(PdhProdSkuChgHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdhProdSkuChgHistMapper.selectList(req);
    }

    public PdhProdSkuChgHistDto.PageResponse getPageData(PdhProdSkuChgHistDto.Request req) {
        PageHelper.addPaging(req);
        PdhProdSkuChgHistDto.PageResponse res = new PdhProdSkuChgHistDto.PageResponse();
        List<PdhProdSkuChgHistDto.Item> list = pdhProdSkuChgHistMapper.selectPageList(req);
        long count = pdhProdSkuChgHistMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdhProdSkuChgHist create(PdhProdSkuChgHist body) {
        body.setHistId(CmUtil.generateId("pdh_prod_sku_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdSkuChgHist saved = pdhProdSkuChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getHistId());
    }

    @Transactional
    public PdhProdSkuChgHist save(PdhProdSkuChgHist entity) {
        if (!existsById(entity.getHistId()))
            throw new CmBizException("존재하지 않는 PdhProdSkuChgHist입니다: " + entity.getHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdSkuChgHist saved = pdhProdSkuChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getHistId());
    }

    @Transactional
    public PdhProdSkuChgHist update(String id, PdhProdSkuChgHist body) {
        PdhProdSkuChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "histId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdSkuChgHist saved = pdhProdSkuChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public PdhProdSkuChgHist updatePartial(PdhProdSkuChgHist entity) {
        if (entity.getHistId() == null) throw new CmBizException("histId 가 필요합니다.");
        if (!existsById(entity.getHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdSkuChgHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getHistId());
    }

    @Transactional
    public void delete(String id) {
        PdhProdSkuChgHist entity = findById(id);
        pdhProdSkuChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<PdhProdSkuChgHist> saveList(List<PdhProdSkuChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getHistId() != null)
            .map(PdhProdSkuChgHist::getHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdhProdSkuChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<PdhProdSkuChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getHistId() != null)
            .toList();
        for (PdhProdSkuChgHist row : updateRows) {
            PdhProdSkuChgHist entity = findById(row.getHistId());
            VoUtil.voCopyExclude(row, entity, "histId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdhProdSkuChgHistRepository.save(entity);
            upsertedIds.add(entity.getHistId());
        }
        em.flush();

        List<PdhProdSkuChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdhProdSkuChgHist row : insertRows) {
            row.setHistId(CmUtil.generateId("pdh_prod_sku_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdhProdSkuChgHistRepository.save(row);
            upsertedIds.add(row.getHistId());
        }
        em.flush();
        em.clear();

        List<PdhProdSkuChgHist> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
