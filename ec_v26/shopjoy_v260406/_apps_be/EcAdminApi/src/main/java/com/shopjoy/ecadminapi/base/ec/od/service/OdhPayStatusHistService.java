package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhPayStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhPayStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhPayStatusHistRepository;
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
public class OdhPayStatusHistService {

    private final OdhPayStatusHistMapper odhPayStatusHistMapper;
    private final OdhPayStatusHistRepository odhPayStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhPayStatusHistDto.Item getById(String id) {
        OdhPayStatusHistDto.Item dto = odhPayStatusHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdhPayStatusHist findById(String id) {
        return odhPayStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odhPayStatusHistRepository.existsById(id);
    }

    public List<OdhPayStatusHistDto.Item> getList(OdhPayStatusHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odhPayStatusHistMapper.selectList(VoUtil.voToMap(req));
    }

    public OdhPayStatusHistDto.PageResponse getPageData(OdhPayStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        OdhPayStatusHistDto.PageResponse res = new OdhPayStatusHistDto.PageResponse();
        List<OdhPayStatusHistDto.Item> list = odhPayStatusHistMapper.selectPageList(VoUtil.voToMap(req));
        long count = odhPayStatusHistMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdhPayStatusHist create(OdhPayStatusHist body) {
        body.setPayStatusHistId(CmUtil.generateId("odh_pay_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhPayStatusHist saved = odhPayStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhPayStatusHist save(OdhPayStatusHist entity) {
        if (!existsById(entity.getPayStatusHistId()))
            throw new CmBizException("존재하지 않는 OdhPayStatusHist입니다: " + entity.getPayStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhPayStatusHist saved = odhPayStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhPayStatusHist update(String id, OdhPayStatusHist body) {
        OdhPayStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "payStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhPayStatusHist saved = odhPayStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhPayStatusHist updateSelective(OdhPayStatusHist entity) {
        if (entity.getPayStatusHistId() == null) throw new CmBizException("payStatusHistId 가 필요합니다.");
        if (!existsById(entity.getPayStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getPayStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhPayStatusHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhPayStatusHist entity = findById(id);
        odhPayStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdhPayStatusHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getPayStatusHistId() != null)
            .map(OdhPayStatusHist::getPayStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhPayStatusHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhPayStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getPayStatusHistId() != null)
            .toList();
        for (OdhPayStatusHist row : updateRows) {
            OdhPayStatusHist entity = findById(row.getPayStatusHistId());
            VoUtil.voCopyExclude(row, entity, "payStatusHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhPayStatusHistRepository.save(entity);
        }
        em.flush();

        List<OdhPayStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhPayStatusHist row : insertRows) {
            row.setPayStatusHistId(CmUtil.generateId("odh_pay_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhPayStatusHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
