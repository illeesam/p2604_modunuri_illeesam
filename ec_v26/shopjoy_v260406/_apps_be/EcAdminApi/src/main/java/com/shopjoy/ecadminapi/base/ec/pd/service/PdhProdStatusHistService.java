package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdStatusHist;
import com.shopjoy.ecadminapi.base.ec.pd.mapper.PdhProdStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdStatusHistRepository;
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
public class PdhProdStatusHistService {

    private final PdhProdStatusHistMapper pdhProdStatusHistMapper;
    private final PdhProdStatusHistRepository pdhProdStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    public PdhProdStatusHistDto.Item getById(String id) {
        PdhProdStatusHistDto.Item dto = pdhProdStatusHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public PdhProdStatusHist findById(String id) {
        return pdhProdStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return pdhProdStatusHistRepository.existsById(id);
    }

    public List<PdhProdStatusHistDto.Item> getList(PdhProdStatusHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return pdhProdStatusHistMapper.selectList(VoUtil.voToMap(req));
    }

    public PdhProdStatusHistDto.PageResponse getPageData(PdhProdStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        PdhProdStatusHistDto.PageResponse res = new PdhProdStatusHistDto.PageResponse();
        List<PdhProdStatusHistDto.Item> list = pdhProdStatusHistMapper.selectPageList(VoUtil.voToMap(req));
        long count = pdhProdStatusHistMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public PdhProdStatusHist create(PdhProdStatusHist body) {
        body.setProdStatusHistId(CmUtil.generateId("pdh_prod_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdStatusHist saved = pdhProdStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdhProdStatusHist save(PdhProdStatusHist entity) {
        if (!existsById(entity.getProdStatusHistId()))
            throw new CmBizException("존재하지 않는 PdhProdStatusHist입니다: " + entity.getProdStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdStatusHist saved = pdhProdStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdhProdStatusHist update(String id, PdhProdStatusHist body) {
        PdhProdStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "prodStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdStatusHist saved = pdhProdStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public PdhProdStatusHist updatePartial(PdhProdStatusHist entity) {
        if (entity.getProdStatusHistId() == null) throw new CmBizException("prodStatusHistId 가 필요합니다.");
        if (!existsById(entity.getProdStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getProdStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdStatusHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        PdhProdStatusHist entity = findById(id);
        pdhProdStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<PdhProdStatusHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getProdStatusHistId() != null)
            .map(PdhProdStatusHist::getProdStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            pdhProdStatusHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<PdhProdStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getProdStatusHistId() != null)
            .toList();
        for (PdhProdStatusHist row : updateRows) {
            PdhProdStatusHist entity = findById(row.getProdStatusHistId());
            VoUtil.voCopyExclude(row, entity, "prodStatusHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            pdhProdStatusHistRepository.save(entity);
        }
        em.flush();

        List<PdhProdStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (PdhProdStatusHist row : insertRows) {
            row.setProdStatusHistId(CmUtil.generateId("pdh_prod_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            pdhProdStatusHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
