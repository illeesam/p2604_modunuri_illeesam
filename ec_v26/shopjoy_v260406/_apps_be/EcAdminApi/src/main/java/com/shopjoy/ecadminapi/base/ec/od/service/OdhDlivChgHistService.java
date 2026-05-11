package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivChgHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhDlivChgHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivChgHistRepository;
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
public class OdhDlivChgHistService {

    private final OdhDlivChgHistMapper odhDlivChgHistMapper;
    private final OdhDlivChgHistRepository odhDlivChgHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhDlivChgHistDto.Item getById(String id) {
        OdhDlivChgHistDto.Item dto = odhDlivChgHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdhDlivChgHist findById(String id) {
        return odhDlivChgHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odhDlivChgHistRepository.existsById(id);
    }

    public List<OdhDlivChgHistDto.Item> getList(OdhDlivChgHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odhDlivChgHistMapper.selectList(VoUtil.voToMap(req));
    }

    public OdhDlivChgHistDto.PageResponse getPageData(OdhDlivChgHistDto.Request req) {
        PageHelper.addPaging(req);
        OdhDlivChgHistDto.PageResponse res = new OdhDlivChgHistDto.PageResponse();
        List<OdhDlivChgHistDto.Item> list = odhDlivChgHistMapper.selectPageList(VoUtil.voToMap(req));
        long count = odhDlivChgHistMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdhDlivChgHist create(OdhDlivChgHist body) {
        body.setDlivChgHistId(CmUtil.generateId("odh_dliv_chg_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhDlivChgHist saved = odhDlivChgHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhDlivChgHist save(OdhDlivChgHist entity) {
        if (!existsById(entity.getDlivChgHistId()))
            throw new CmBizException("존재하지 않는 OdhDlivChgHist입니다: " + entity.getDlivChgHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhDlivChgHist saved = odhDlivChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhDlivChgHist update(String id, OdhDlivChgHist body) {
        OdhDlivChgHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivChgHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhDlivChgHist saved = odhDlivChgHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhDlivChgHist updateSelective(OdhDlivChgHist entity) {
        if (entity.getDlivChgHistId() == null) throw new CmBizException("dlivChgHistId 가 필요합니다.");
        if (!existsById(entity.getDlivChgHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivChgHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhDlivChgHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhDlivChgHist entity = findById(id);
        odhDlivChgHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdhDlivChgHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDlivChgHistId() != null)
            .map(OdhDlivChgHist::getDlivChgHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhDlivChgHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhDlivChgHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDlivChgHistId() != null)
            .toList();
        for (OdhDlivChgHist row : updateRows) {
            OdhDlivChgHist entity = findById(row.getDlivChgHistId());
            VoUtil.voCopyExclude(row, entity, "dlivChgHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhDlivChgHistRepository.save(entity);
        }
        em.flush();

        List<OdhDlivChgHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhDlivChgHist row : insertRows) {
            row.setDlivChgHistId(CmUtil.generateId("odh_dliv_chg_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhDlivChgHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
