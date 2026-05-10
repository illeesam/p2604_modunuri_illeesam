package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivItemChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivItemChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhDlivItemChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivItemChgHistRepository;
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
public class OdhDlivItemChgHistService {

    private final OdhDlivItemChgHistMapper odhDlivItemChgHistMapper;
    private final OdhDlivItemChgHistRepository odhDlivItemChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhDlivItemChgHistDto.Item getById(String id) {
        OdhDlivItemChgHistDto.Item dto = odhDlivItemChgHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdhDlivItemChgHist findById(String id) {
        return odhDlivItemChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odhDlivItemChgHistRepository.existsById(id);
    }

    public List<OdhDlivItemChgHistDto.Item> getList(OdhDlivItemChgHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odhDlivItemChgHistMapper.selectList(VoUtil.voToMap(req));
    }

    public OdhDlivItemChgHistDto.PageResponse getPageData(OdhDlivItemChgHistDto.Request req) {
        PageHelper.addPaging(req);
        OdhDlivItemChgHistDto.PageResponse res = new OdhDlivItemChgHistDto.PageResponse();
        List<OdhDlivItemChgHistDto.Item> list = odhDlivItemChgHistMapper.selectPageList(VoUtil.voToMap(req));
        long count = odhDlivItemChgHistMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdhDlivItemChgHist create(OdhDlivItemChgHist body) {
        body.setDlivItemChgHistId(CmUtil.generateId("odh_dliv_item_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhDlivItemChgHist saved = odhDlivItemChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhDlivItemChgHist save(OdhDlivItemChgHist entity) {
        if (!existsById(entity.getDlivItemChgHistId()))
            throw new CmBizException("존재하지 않는 OdhDlivItemChgHist입니다: " + entity.getDlivItemChgHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhDlivItemChgHist saved = odhDlivItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhDlivItemChgHist update(String id, OdhDlivItemChgHist body) {
        OdhDlivItemChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivItemChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhDlivItemChgHist saved = odhDlivItemChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhDlivItemChgHist updatePartial(OdhDlivItemChgHist entity) {
        if (entity.getDlivItemChgHistId() == null) throw new CmBizException("dlivItemChgHistId 가 필요합니다.");
        if (!existsById(entity.getDlivItemChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivItemChgHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhDlivItemChgHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhDlivItemChgHist entity = findById(id);
        odhDlivItemChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdhDlivItemChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDlivItemChgHistId() != null)
            .map(OdhDlivItemChgHist::getDlivItemChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhDlivItemChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhDlivItemChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDlivItemChgHistId() != null)
            .toList();
        for (OdhDlivItemChgHist row : updateRows) {
            OdhDlivItemChgHist entity = findById(row.getDlivItemChgHistId());
            VoUtil.voCopyExclude(row, entity, "dlivItemChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhDlivItemChgHistRepository.save(entity);
        }
        em.flush();

        List<OdhDlivItemChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhDlivItemChgHist row : insertRows) {
            row.setDlivItemChgHistId(CmUtil.generateId("odh_dliv_item_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhDlivItemChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
