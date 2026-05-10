package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderMapper;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
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
public class OdOrderService {

    private final OdOrderMapper odOrderMapper;
    private final OdOrderRepository odOrderRepository;

    @PersistenceContext
    private EntityManager em;

    public OdOrderDto.Item getById(String id) {
        OdOrderDto.Item dto = odOrderMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public OdOrder findById(String id) {
        return odOrderRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return odOrderRepository.existsById(id);
    }

    public List<OdOrderDto.Item> getList(OdOrderDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return odOrderMapper.selectList(VoUtil.voToMap(req));
    }

    public OdOrderDto.PageResponse getPageData(OdOrderDto.Request req) {
        PageHelper.addPaging(req);
        OdOrderDto.PageResponse res = new OdOrderDto.PageResponse();
        List<OdOrderDto.Item> list = odOrderMapper.selectPageList(VoUtil.voToMap(req));
        long count = odOrderMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public OdOrder create(OdOrder body) {
        body.setOrderId(CmUtil.generateId("od_order"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrder save(OdOrder entity) {
        if (!existsById(entity.getOrderId()))
            throw new CmBizException("존재하지 않는 OdOrder입니다: " + entity.getOrderId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrder update(String id, OdOrder body) {
        OdOrder entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public OdOrder updatePartial(OdOrder entity) {
        if (entity.getOrderId() == null) throw new CmBizException("orderId 가 필요합니다.");
        if (!existsById(entity.getOrderId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odOrderMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        OdOrder entity = findById(id);
        odOrderRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<OdOrder> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getOrderId() != null)
            .map(OdOrder::getOrderId)
            .toList();
        if (!deleteIds.isEmpty()) {
            odOrderRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<OdOrder> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getOrderId() != null)
            .toList();
        for (OdOrder row : updateRows) {
            OdOrder entity = findById(row.getOrderId());
            VoUtil.voCopyExclude(row, entity, "orderId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            odOrderRepository.save(entity);
        }
        em.flush();

        List<OdOrder> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (OdOrder row : insertRows) {
            row.setOrderId(CmUtil.generateId("od_order"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            odOrderRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
