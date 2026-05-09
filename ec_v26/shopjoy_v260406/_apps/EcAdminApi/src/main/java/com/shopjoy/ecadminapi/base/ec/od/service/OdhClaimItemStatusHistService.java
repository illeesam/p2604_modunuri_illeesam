package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhClaimItemStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimItemStatusHistRepository;
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
public class OdhClaimItemStatusHistService {

    private final OdhClaimItemStatusHistMapper odhClaimItemStatusHistMapper;
    private final OdhClaimItemStatusHistRepository odhClaimItemStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhClaimItemStatusHistDto.Item getById(String id) {
        OdhClaimItemStatusHistDto.Item dto = odhClaimItemStatusHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdhClaimItemStatusHist findById(String id) {
        return odhClaimItemStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odhClaimItemStatusHistRepository.existsById(id);
    }

    public List<OdhClaimItemStatusHistDto.Item> getList(OdhClaimItemStatusHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odhClaimItemStatusHistMapper.selectList(VoUtil.voToMap(req));
    }

    public OdhClaimItemStatusHistDto.PageResponse getPageData(OdhClaimItemStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        OdhClaimItemStatusHistDto.PageResponse res = new OdhClaimItemStatusHistDto.PageResponse();
        List<OdhClaimItemStatusHistDto.Item> list = odhClaimItemStatusHistMapper.selectPageList(VoUtil.voToMap(req));
        long count = odhClaimItemStatusHistMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdhClaimItemStatusHist create(OdhClaimItemStatusHist body) {
        body.setClaimItemStatusHistId(CmUtil.generateId("odh_claim_item_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhClaimItemStatusHist saved = odhClaimItemStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhClaimItemStatusHist save(OdhClaimItemStatusHist entity) {
        if (!existsById(entity.getClaimItemStatusHistId()))
            throw new CmBizException("존재하지 않는 OdhClaimItemStatusHist입니다: " + entity.getClaimItemStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimItemStatusHist saved = odhClaimItemStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhClaimItemStatusHist update(String id, OdhClaimItemStatusHist body) {
        OdhClaimItemStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimItemStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimItemStatusHist saved = odhClaimItemStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhClaimItemStatusHist updatePartial(OdhClaimItemStatusHist entity) {
        if (entity.getClaimItemStatusHistId() == null) throw new CmBizException("claimItemStatusHistId 가 필요합니다.");
        if (!existsById(entity.getClaimItemStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimItemStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhClaimItemStatusHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhClaimItemStatusHist entity = findById(id);
        odhClaimItemStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdhClaimItemStatusHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getClaimItemStatusHistId() != null)
            .map(OdhClaimItemStatusHist::getClaimItemStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhClaimItemStatusHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhClaimItemStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getClaimItemStatusHistId() != null)
            .toList();
        for (OdhClaimItemStatusHist row : updateRows) {
            OdhClaimItemStatusHist entity = findById(row.getClaimItemStatusHistId());
            VoUtil.voCopyExclude(row, entity, "claimItemStatusHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhClaimItemStatusHistRepository.save(entity);
        }
        em.flush();

        List<OdhClaimItemStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhClaimItemStatusHist row : insertRows) {
            row.setClaimItemStatusHistId(CmUtil.generateId("odh_claim_item_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhClaimItemStatusHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
