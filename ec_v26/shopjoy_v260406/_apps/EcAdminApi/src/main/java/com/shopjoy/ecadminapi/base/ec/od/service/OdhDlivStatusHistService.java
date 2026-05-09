package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhDlivStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhDlivStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivStatusHistRepository;
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
public class OdhDlivStatusHistService {

    private final OdhDlivStatusHistMapper odhDlivStatusHistMapper;
    private final OdhDlivStatusHistRepository odhDlivStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhDlivStatusHistDto.Item getById(String id) {
        OdhDlivStatusHistDto.Item dto = odhDlivStatusHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdhDlivStatusHist findById(String id) {
        return odhDlivStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odhDlivStatusHistRepository.existsById(id);
    }

    public List<OdhDlivStatusHistDto.Item> getList(OdhDlivStatusHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odhDlivStatusHistMapper.selectList(req);
    }

    public OdhDlivStatusHistDto.PageResponse getPageData(OdhDlivStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        OdhDlivStatusHistDto.PageResponse res = new OdhDlivStatusHistDto.PageResponse();
        List<OdhDlivStatusHistDto.Item> list = odhDlivStatusHistMapper.selectPageList(req);
        long count = odhDlivStatusHistMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdhDlivStatusHist create(OdhDlivStatusHist body) {
        body.setDlivStatusHistId(CmUtil.generateId("odh_dliv_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhDlivStatusHist saved = odhDlivStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhDlivStatusHist save(OdhDlivStatusHist entity) {
        if (!existsById(entity.getDlivStatusHistId()))
            throw new CmBizException("존재하지 않는 OdhDlivStatusHist입니다: " + entity.getDlivStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhDlivStatusHist saved = odhDlivStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhDlivStatusHist update(String id, OdhDlivStatusHist body) {
        OdhDlivStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "dlivStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhDlivStatusHist saved = odhDlivStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhDlivStatusHist updatePartial(OdhDlivStatusHist entity) {
        if (entity.getDlivStatusHistId() == null) throw new CmBizException("dlivStatusHistId 가 필요합니다.");
        if (!existsById(entity.getDlivStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getDlivStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhDlivStatusHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhDlivStatusHist entity = findById(id);
        odhDlivStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdhDlivStatusHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getDlivStatusHistId() != null)
            .map(OdhDlivStatusHist::getDlivStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhDlivStatusHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhDlivStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getDlivStatusHistId() != null)
            .toList();
        for (OdhDlivStatusHist row : updateRows) {
            OdhDlivStatusHist entity = findById(row.getDlivStatusHistId());
            VoUtil.voCopyExclude(row, entity, "dlivStatusHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhDlivStatusHistRepository.save(entity);
        }
        em.flush();

        List<OdhDlivStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhDlivStatusHist row : insertRows) {
            row.setDlivStatusHistId(CmUtil.generateId("odh_dliv_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhDlivStatusHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
