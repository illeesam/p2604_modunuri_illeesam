package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhClaimStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimStatusHistRepository;
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
public class OdhClaimStatusHistService {

    private final OdhClaimStatusHistMapper odhClaimStatusHistMapper;
    private final OdhClaimStatusHistRepository odhClaimStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhClaimStatusHistDto.Item getById(String id) {
        OdhClaimStatusHistDto.Item dto = odhClaimStatusHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdhClaimStatusHist findById(String id) {
        return odhClaimStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odhClaimStatusHistRepository.existsById(id);
    }

    public List<OdhClaimStatusHistDto.Item> getList(OdhClaimStatusHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odhClaimStatusHistMapper.selectList(VoUtil.voToMap(req));
    }

    public OdhClaimStatusHistDto.PageResponse getPageData(OdhClaimStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        OdhClaimStatusHistDto.PageResponse res = new OdhClaimStatusHistDto.PageResponse();
        List<OdhClaimStatusHistDto.Item> list = odhClaimStatusHistMapper.selectPageList(VoUtil.voToMap(req));
        long count = odhClaimStatusHistMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdhClaimStatusHist create(OdhClaimStatusHist body) {
        body.setClaimStatusHistId(CmUtil.generateId("odh_claim_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhClaimStatusHist saved = odhClaimStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhClaimStatusHist save(OdhClaimStatusHist entity) {
        if (!existsById(entity.getClaimStatusHistId()))
            throw new CmBizException("존재하지 않는 OdhClaimStatusHist입니다: " + entity.getClaimStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimStatusHist saved = odhClaimStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhClaimStatusHist update(String id, OdhClaimStatusHist body) {
        OdhClaimStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimStatusHist saved = odhClaimStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhClaimStatusHist updatePartial(OdhClaimStatusHist entity) {
        if (entity.getClaimStatusHistId() == null) throw new CmBizException("claimStatusHistId 가 필요합니다.");
        if (!existsById(entity.getClaimStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhClaimStatusHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhClaimStatusHist entity = findById(id);
        odhClaimStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdhClaimStatusHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getClaimStatusHistId() != null)
            .map(OdhClaimStatusHist::getClaimStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhClaimStatusHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhClaimStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getClaimStatusHistId() != null)
            .toList();
        for (OdhClaimStatusHist row : updateRows) {
            OdhClaimStatusHist entity = findById(row.getClaimStatusHistId());
            VoUtil.voCopyExclude(row, entity, "claimStatusHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhClaimStatusHistRepository.save(entity);
        }
        em.flush();

        List<OdhClaimStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhClaimStatusHist row : insertRows) {
            row.setClaimStatusHistId(CmUtil.generateId("odh_claim_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhClaimStatusHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
