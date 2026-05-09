package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefundMethod;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdRefundMethodMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdRefundMethodRepository;
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
public class OdRefundMethodService {

    private final OdRefundMethodMapper odRefundMethodMapper;
    private final OdRefundMethodRepository odRefundMethodRepository;

    @PersistenceContext
    private EntityManager em;

    public OdRefundMethodDto.Item getById(String id) {
        OdRefundMethodDto.Item dto = odRefundMethodMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdRefundMethod findById(String id) {
        return odRefundMethodRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odRefundMethodRepository.existsById(id);
    }

    public List<OdRefundMethodDto.Item> getList(OdRefundMethodDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odRefundMethodMapper.selectList(req);
    }

    public OdRefundMethodDto.PageResponse getPageData(OdRefundMethodDto.Request req) {
        PageHelper.addPaging(req);
        OdRefundMethodDto.PageResponse res = new OdRefundMethodDto.PageResponse();
        List<OdRefundMethodDto.Item> list = odRefundMethodMapper.selectPageList(req);
        long count = odRefundMethodMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdRefundMethod create(OdRefundMethod body) {
        body.setRefundMethodId(CmUtil.generateId("od_refund_method"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdRefundMethod saved = odRefundMethodRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdRefundMethod save(OdRefundMethod entity) {
        if (!existsById(entity.getRefundMethodId()))
            throw new CmBizException("존재하지 않는 OdRefundMethod입니다: " + entity.getRefundMethodId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdRefundMethod saved = odRefundMethodRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdRefundMethod update(String id, OdRefundMethod body) {
        OdRefundMethod entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "refundMethodId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdRefundMethod saved = odRefundMethodRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdRefundMethod updatePartial(OdRefundMethod entity) {
        if (entity.getRefundMethodId() == null) throw new CmBizException("refundMethodId 가 필요합니다.");
        if (!existsById(entity.getRefundMethodId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getRefundMethodId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odRefundMethodMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdRefundMethod entity = findById(id);
        odRefundMethodRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdRefundMethod> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getRefundMethodId() != null)
            .map(OdRefundMethod::getRefundMethodId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odRefundMethodRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdRefundMethod> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getRefundMethodId() != null)
            .toList();
        for (OdRefundMethod row : updateRows) {
            OdRefundMethod entity = findById(row.getRefundMethodId());
            VoUtil.voCopyExclude(row, entity, "refundMethodId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odRefundMethodRepository.save(entity);
        }
        em.flush();

        List<OdRefundMethod> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdRefundMethod row : insertRows) {
            row.setRefundMethodId(CmUtil.generateId("od_refund_method"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odRefundMethodRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
