package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
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

    private final OdOrderRepository odOrderRepository;

    @PersistenceContext
    private EntityManager em;

    /* 주문 키조회 */
    public OdOrderDto.Item getById(String id) {
        OdOrderDto.Item dto = odOrderRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdOrderDto.Item getByIdOrNull(String id) {
        return odOrderRepository.selectById(id).orElse(null);
    }

    /* 주문 상세조회 */
    public OdOrder findById(String id) {
        return odOrderRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdOrder findByIdOrNull(String id) {
        return odOrderRepository.findById(id).orElse(null);
    }

    /* 주문 키검증 */
    public boolean existsById(String id) {
        return odOrderRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odOrderRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 주문 목록조회 */
    public List<OdOrderDto.Item> getList(OdOrderDto.Request req) {
        return odOrderRepository.selectList(req);
    }

    /* 주문 페이지조회 */
    public OdOrderDto.PageResponse getPageData(OdOrderDto.Request req) {
        PageHelper.addPaging(req);
        return odOrderRepository.selectPageList(req);
    }

    /* 주문 등록 */
    @Transactional
    public OdOrder create(OdOrder body) {
        body.setOrderId(CmUtil.generateId("od_order"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 주문 저장 */
    @Transactional
    public OdOrder save(OdOrder entity) {
        if (!existsById(entity.getOrderId()))
            throw new CmBizException("존재하지 않는 OdOrder입니다: " + entity.getOrderId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 주문 수정 */
    @Transactional
    public OdOrder update(String id, OdOrder body) {
        OdOrder entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "orderId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 주문 수정 */
    @Transactional
    public OdOrder updateSelective(OdOrder entity) {
        if (entity.getOrderId() == null) throw new CmBizException("orderId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getOrderId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getOrderId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odOrderRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 주문 삭제 */
    @Transactional
    public void delete(String id) {
        OdOrder entity = findById(id);
        odOrderRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 주문 목록저장 */
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
