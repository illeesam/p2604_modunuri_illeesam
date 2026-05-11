package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderItemDiscntMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderItemDiscntRepository;
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
public class OdOrderItemDiscntService {

    private final OdOrderItemDiscntMapper odOrderItemDiscntMapper;
    private final OdOrderItemDiscntRepository odOrderItemDiscntRepository;

    @PersistenceContext
    private EntityManager em;

    public OdOrderItemDiscntDto.Item getById(String id) {
        OdOrderItemDiscntDto.Item dto = odOrderItemDiscntMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdOrderItemDiscnt findById(String id) {
        return odOrderItemDiscntRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odOrderItemDiscntRepository.existsById(id);
    }

    public List<OdOrderItemDiscntDto.Item> getList(OdOrderItemDiscntDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odOrderItemDiscntMapper.selectList(VoUtil.voToMap(req));
    }

    public OdOrderItemDiscntDto.PageResponse getPageData(OdOrderItemDiscntDto.Request req) {
        PageHelper.addPaging(req);
        OdOrderItemDiscntDto.PageResponse res = new OdOrderItemDiscntDto.PageResponse();
        List<OdOrderItemDiscntDto.Item> list = odOrderItemDiscntMapper.selectPageList(VoUtil.voToMap(req));
        long count = odOrderItemDiscntMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdOrderItemDiscnt create(OdOrderItemDiscnt body) {
        body.setItemDiscntId(CmUtil.generateId("od_order_item_discnt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdOrderItemDiscnt saved = odOrderItemDiscntRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrderItemDiscnt save(OdOrderItemDiscnt entity) {
        if (!existsById(entity.getItemDiscntId()))
            throw new CmBizException("존재하지 않는 OdOrderItemDiscnt입니다: " + entity.getItemDiscntId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderItemDiscnt saved = odOrderItemDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrderItemDiscnt update(String id, OdOrderItemDiscnt body) {
        OdOrderItemDiscnt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "itemDiscntId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderItemDiscnt saved = odOrderItemDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrderItemDiscnt updateSelective(OdOrderItemDiscnt entity) {
        if (entity.getItemDiscntId() == null) throw new CmBizException("itemDiscntId 가 필요합니다.");
        if (!existsById(entity.getItemDiscntId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getItemDiscntId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odOrderItemDiscntMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdOrderItemDiscnt entity = findById(id);
        odOrderItemDiscntRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdOrderItemDiscnt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getItemDiscntId() != null)
            .map(OdOrderItemDiscnt::getItemDiscntId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odOrderItemDiscntRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdOrderItemDiscnt> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getItemDiscntId() != null)
            .toList();
        for (OdOrderItemDiscnt row : updateRows) {
            OdOrderItemDiscnt entity = findById(row.getItemDiscntId());
            VoUtil.voCopyExclude(row, entity, "itemDiscntId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odOrderItemDiscntRepository.save(entity);
        }
        em.flush();

        List<OdOrderItemDiscnt> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdOrderItemDiscnt row : insertRows) {
            row.setItemDiscntId(CmUtil.generateId("od_order_item_discnt"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odOrderItemDiscntRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
