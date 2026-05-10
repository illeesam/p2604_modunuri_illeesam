package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhOrderItemStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdhOrderItemStatusHistMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderItemStatusHistRepository;
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
public class OdhOrderItemStatusHistService {

    private final OdhOrderItemStatusHistMapper odhOrderItemStatusHistMapper;
    private final OdhOrderItemStatusHistRepository odhOrderItemStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    public OdhOrderItemStatusHistDto.Item getById(String id) {
        OdhOrderItemStatusHistDto.Item dto = odhOrderItemStatusHistMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdhOrderItemStatusHist findById(String id) {
        return odhOrderItemStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odhOrderItemStatusHistRepository.existsById(id);
    }

    public List<OdhOrderItemStatusHistDto.Item> getList(OdhOrderItemStatusHistDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odhOrderItemStatusHistMapper.selectList(VoUtil.voToMap(req));
    }

    public OdhOrderItemStatusHistDto.PageResponse getPageData(OdhOrderItemStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        OdhOrderItemStatusHistDto.PageResponse res = new OdhOrderItemStatusHistDto.PageResponse();
        List<OdhOrderItemStatusHistDto.Item> list = odhOrderItemStatusHistMapper.selectPageList(VoUtil.voToMap(req));
        long count = odhOrderItemStatusHistMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdhOrderItemStatusHist create(OdhOrderItemStatusHist body) {
        body.setOrderItemStatusHistId(CmUtil.generateId("odh_order_item_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhOrderItemStatusHist saved = odhOrderItemStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderItemStatusHist save(OdhOrderItemStatusHist entity) {
        if (!existsById(entity.getOrderItemStatusHistId()))
            throw new CmBizException("존재하지 않는 OdhOrderItemStatusHist입니다: " + entity.getOrderItemStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhOrderItemStatusHist saved = odhOrderItemStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderItemStatusHist update(String id, OdhOrderItemStatusHist body) {
        OdhOrderItemStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderItemStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhOrderItemStatusHist saved = odhOrderItemStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdhOrderItemStatusHist updatePartial(OdhOrderItemStatusHist entity) {
        if (entity.getOrderItemStatusHistId() == null) throw new CmBizException("orderItemStatusHistId 가 필요합니다.");
        if (!existsById(entity.getOrderItemStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderItemStatusHistId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhOrderItemStatusHistMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdhOrderItemStatusHist entity = findById(id);
        odhOrderItemStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdhOrderItemStatusHist> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getOrderItemStatusHistId() != null)
            .map(OdhOrderItemStatusHist::getOrderItemStatusHistId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odhOrderItemStatusHistRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdhOrderItemStatusHist> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getOrderItemStatusHistId() != null)
            .toList();
        for (OdhOrderItemStatusHist row : updateRows) {
            OdhOrderItemStatusHist entity = findById(row.getOrderItemStatusHistId());
            VoUtil.voCopyExclude(row, entity, "orderItemStatusHistId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odhOrderItemStatusHistRepository.save(entity);
        }
        em.flush();

        List<OdhOrderItemStatusHist> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdhOrderItemStatusHist row : insertRows) {
            row.setOrderItemStatusHistId(CmUtil.generateId("odh_order_item_status_hist"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odhOrderItemStatusHistRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
