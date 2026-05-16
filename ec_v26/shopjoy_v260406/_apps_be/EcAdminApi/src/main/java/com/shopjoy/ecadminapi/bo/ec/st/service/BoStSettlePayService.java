package com.shopjoy.ecadminapi.bo.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettlePayRepository;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettlePayService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * BO 정산결제 서비스 — base StSettlePayService 위임 (thin wrapper) + pay.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoStSettlePayService {

    private final StSettlePayService stSettlePayService;
    private final StSettlePayRepository stSettlePayRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public StSettlePayDto.Item getById(String id) { return stSettlePayService.getById(id); }
    /* 목록조회 */
    public List<StSettlePayDto.Item> getList(StSettlePayDto.Request req) { return stSettlePayService.getList(req); }
    /* 페이지조회 */
    public StSettlePayDto.PageResponse getPageData(StSettlePayDto.Request req) { return stSettlePayService.getPageData(req); }

    @Transactional public StSettlePay create(StSettlePay body) { return stSettlePayService.create(body); }
    @Transactional public StSettlePay update(String id, StSettlePay body) { return stSettlePayService.update(id, body); }
    @Transactional public void delete(String id) { stSettlePayService.delete(id); }
    @Transactional public void saveList(List<StSettlePay> rows) { stSettlePayService.saveList(rows); }

    /** pay — 결제 처리 */
    @Transactional
    public StSettlePayDto.Item pay(String id) {
        StSettlePay entity = stSettlePayRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setPayStatusCdBefore(entity.getPayStatusCd());
        entity.setPayStatusCd("PAID");
        entity.setPayDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettlePay saved = stSettlePayRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return stSettlePayService.getById(id);
    }
}
