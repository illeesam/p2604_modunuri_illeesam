package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDiscntDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderDiscnt;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderDiscntMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderDiscntRepository;
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
public class OdOrderDiscntService {

    private final OdOrderDiscntMapper odOrderDiscntMapper;
    private final OdOrderDiscntRepository odOrderDiscntRepository;

    @PersistenceContext
    private EntityManager em;

    public OdOrderDiscntDto.Item getById(String id) {
        OdOrderDiscntDto.Item dto = odOrderDiscntMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdOrderDiscnt findById(String id) {
        return odOrderDiscntRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odOrderDiscntRepository.existsById(id);
    }

    public List<OdOrderDiscntDto.Item> getList(OdOrderDiscntDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odOrderDiscntMapper.selectList(req);
    }

    public OdOrderDiscntDto.PageResponse getPageData(OdOrderDiscntDto.Request req) {
        PageHelper.addPaging(req);
        OdOrderDiscntDto.PageResponse res = new OdOrderDiscntDto.PageResponse();
        List<OdOrderDiscntDto.Item> list = odOrderDiscntMapper.selectPageList(req);
        long count = odOrderDiscntMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdOrderDiscnt create(OdOrderDiscnt body) {
        body.setOrderDiscntId(CmUtil.generateId("od_order_discnt"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdOrderDiscnt saved = odOrderDiscntRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getOrderDiscntId());
    }

    @Transactional
    public OdOrderDiscnt save(OdOrderDiscnt entity) {
        if (!existsById(entity.getOrderDiscntId()))
            throw new CmBizException("존재하지 않는 OdOrderDiscnt입니다: " + entity.getOrderDiscntId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderDiscnt saved = odOrderDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getOrderDiscntId());
    }

    @Transactional
    public OdOrderDiscnt update(String id, OdOrderDiscnt body) {
        OdOrderDiscnt entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderDiscntId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrderDiscnt saved = odOrderDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public OdOrderDiscnt updatePartial(OdOrderDiscnt entity) {
        if (entity.getOrderDiscntId() == null) throw new CmBizException("orderDiscntId 가 필요합니다.");
        if (!existsById(entity.getOrderDiscntId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderDiscntId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odOrderDiscntMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getOrderDiscntId());
    }

    @Transactional
    public void delete(String id) {
        OdOrderDiscnt entity = findById(id);
        odOrderDiscntRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public List<OdOrderDiscnt> saveList(List<OdOrderDiscnt> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getOrderDiscntId() != null)
            .map(OdOrderDiscnt::getOrderDiscntId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odOrderDiscntRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<OdOrderDiscnt> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getOrderDiscntId() != null)
            .toList();
        for (OdOrderDiscnt row : updateRows) {
            OdOrderDiscnt entity = findById(row.getOrderDiscntId());
            VoUtil.voCopyExclude(row, entity, "orderDiscntId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odOrderDiscntRepository.save(entity);
            upsertedIds.add(entity.getOrderDiscntId());
        }
        em.flush();

        List<OdOrderDiscnt> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdOrderDiscnt row : insertRows) {
            row.setOrderDiscntId(CmUtil.generateId("od_order_discnt"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odOrderDiscntRepository.save(row);
            upsertedIds.add(row.getOrderDiscntId());
        }
        em.flush();
        em.clear();

        List<OdOrderDiscnt> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
