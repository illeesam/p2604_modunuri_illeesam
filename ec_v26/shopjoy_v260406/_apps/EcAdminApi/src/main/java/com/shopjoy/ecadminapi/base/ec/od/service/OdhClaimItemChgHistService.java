package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhClaimItemChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimItemChgHistRepository;
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
public class OdhClaimItemChgHistService {

    private final OdhClaimItemChgHistMapper odhClaimItemChgHistMapper;
    private final OdhClaimItemChgHistRepository odhClaimItemChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhClaimItemChgHistDto.Item getById(String id) {
        OdhClaimItemChgHistDto.Item dto = odhClaimItemChgHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdhClaimItemChgHist findById(String id) {
        return odhClaimItemChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odhClaimItemChgHistRepository.existsById(id);
    }

    public List<OdhClaimItemChgHistDto.Item> getList(OdhClaimItemChgHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odhClaimItemChgHistMapper.selectList(req);
    }

    public OdhClaimItemChgHistDto.PageResponse getPageData(OdhClaimItemChgHistDto.Request req) {
        PageHelper.addPaging(req);
        OdhClaimItemChgHistDto.PageResponse res = new OdhClaimItemChgHistDto.PageResponse();
        List<OdhClaimItemChgHistDto.Item> list = odhClaimItemChgHistMapper.selectPageList(req);
        long count = odhClaimItemChgHistMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdhClaimItemChgHist create(OdhClaimItemChgHist body) {
        body.setClaimItemChgHistId(CmUtil.generateId("odh_claim_item_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhClaimItemChgHist saved = odhClaimItemChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getClaimItemChgHistId());
    }

    @Transactional
    public OdhClaimItemChgHist save(OdhClaimItemChgHist entity) {
        if (!existsById(entity.getClaimItemChgHistId()))
            throw new CmBizException("존재하지 않는 OdhClaimItemChgHist입니다: " + entity.getClaimItemChgHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimItemChgHist saved = odhClaimItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getClaimItemChgHistId());
    }

    @Transactional
    public OdhClaimItemChgHist update(String id, OdhClaimItemChgHist body) {
        OdhClaimItemChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimItemChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimItemChgHist saved = odhClaimItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public OdhClaimItemChgHist updatePartial(OdhClaimItemChgHist entity) {
        if (entity.getClaimItemChgHistId() == null) throw new CmBizException("claimItemChgHistId 가 필요합니다.");
        if (!existsById(entity.getClaimItemChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimItemChgHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhClaimItemChgHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getClaimItemChgHistId());
    }

    @Transactional
    public void delete(String id) {
        OdhClaimItemChgHist entity = findById(id);
        odhClaimItemChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<OdhClaimItemChgHist> saveList(List<OdhClaimItemChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getClaimItemChgHistId() != null)
            .map(OdhClaimItemChgHist::getClaimItemChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhClaimItemChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<OdhClaimItemChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getClaimItemChgHistId() != null)
            .toList();
        for (OdhClaimItemChgHist row : updateRows) {
            OdhClaimItemChgHist entity = findById(row.getClaimItemChgHistId());
            VoUtil.voCopyExclude(row, entity, "claimItemChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhClaimItemChgHistRepository.save(entity);
            upsertedIds.add(entity.getClaimItemChgHistId());
        }
        em.flush();

        List<OdhClaimItemChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhClaimItemChgHist row : insertRows) {
            row.setClaimItemChgHistId(CmUtil.generateId("odh_claim_item_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhClaimItemChgHistRepository.save(row);
            upsertedIds.add(row.getClaimItemChgHistId());
        }
        em.flush();
        em.clear();

        List<OdhClaimItemChgHist> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
