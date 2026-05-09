package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdChgHistRepository;
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
public class PdhProdChgHistService {

    private final PdhProdChgHistMapper pdhProdChgHistMapper;
    private final PdhProdChgHistRepository pdhProdChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    public PdhProdChgHistDto.Item getById(String id) {
        PdhProdChgHistDto.Item dto = pdhProdChgHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdhProdChgHist findById(String id) {
        return pdhProdChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdhProdChgHistRepository.existsById(id);
    }

    public List<PdhProdChgHistDto.Item> getList(PdhProdChgHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdhProdChgHistMapper.selectList(VoUtil.voToMap(req));
    }

    public PdhProdChgHistDto.PageResponse getPageData(PdhProdChgHistDto.Request req) {
        PageHelper.addPaging(req);
        PdhProdChgHistDto.PageResponse res = new PdhProdChgHistDto.PageResponse();
        List<PdhProdChgHistDto.Item> list = pdhProdChgHistMapper.selectPageList(VoUtil.voToMap(req));
        long count = pdhProdChgHistMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdhProdChgHist create(PdhProdChgHist body) {
        body.setProdChgHistId(CmUtil.generateId("pdh_prod_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdChgHist saved = pdhProdChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdhProdChgHist save(PdhProdChgHist entity) {
        if (!existsById(entity.getProdChgHistId()))
            throw new CmBizException("존재하지 않는 PdhProdChgHist입니다: " + entity.getProdChgHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdChgHist saved = pdhProdChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdhProdChgHist update(String id, PdhProdChgHist body) {
        PdhProdChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdChgHist saved = pdhProdChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdhProdChgHist updatePartial(PdhProdChgHist entity) {
        if (entity.getProdChgHistId() == null) throw new CmBizException("prodChgHistId 가 필요합니다.");
        if (!existsById(entity.getProdChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdChgHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdChgHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdhProdChgHist entity = findById(id);
        pdhProdChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PdhProdChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdChgHistId() != null)
            .map(PdhProdChgHist::getProdChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdhProdChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdhProdChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getProdChgHistId() != null)
            .toList();
        for (PdhProdChgHist row : updateRows) {
            PdhProdChgHist entity = findById(row.getProdChgHistId());
            VoUtil.voCopyExclude(row, entity, "prodChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdhProdChgHistRepository.save(entity);
        }
        em.flush();

        List<PdhProdChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdhProdChgHist row : insertRows) {
            row.setProdChgHistId(CmUtil.generateId("pdh_prod_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdhProdChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
