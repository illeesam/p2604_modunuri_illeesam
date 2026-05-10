package com.shopjoy.ecadminapi.bo.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecadminapi.base.ec.od.service.OdOrderService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * BO 주문 서비스 — base OdOrderService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoOdOrderService {

    private final OdOrderService odOrderService;
    private final OdOrderRepository odOrderRepository;

    @PersistenceContext
    private EntityManager em;

    public OdOrderDto.Item getById(String id) { return odOrderService.getById(id); }
    public List<OdOrderDto.Item> getList(OdOrderDto.Request req) { return odOrderService.getList(req); }
    public OdOrderDto.PageResponse getPageData(OdOrderDto.Request req) { return odOrderService.getPageData(req); }

    @Transactional public OdOrder create(OdOrder body) {
        if (body.getOrderStatusCd() == null) body.setOrderStatusCd("PENDING");
        return odOrderService.create(body);
    }
    @Transactional public OdOrder update(String id, OdOrder body) { return odOrderService.update(id, body); }
    @Transactional public void delete(String id) { odOrderService.delete(id); }
    @Transactional public void saveList(List<OdOrder> rows) { odOrderService.saveList(rows); }

    /** changeStatus — orderStatusCd 변경 (이력 보존) */
    @Transactional
    public OdOrderDto.Item changeStatus(String id, String statusCd) {
        OdOrder entity = odOrderRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setOrderStatusCdBefore(entity.getOrderStatusCd());
        entity.setOrderStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdOrder saved = odOrderRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return odOrderService.getById(id);
    }
}
