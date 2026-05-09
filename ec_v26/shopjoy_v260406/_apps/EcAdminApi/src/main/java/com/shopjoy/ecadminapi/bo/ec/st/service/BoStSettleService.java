package com.shopjoy.ecadminapi.bo.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleRepository;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleService;
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
 * BO 정산 서비스 — base StSettleService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoStSettleService {

    private final StSettleService stSettleService;
    private final StSettleRepository stSettleRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettleDto.Item getById(String id) { return stSettleService.getById(id); }
    public List<StSettleDto.Item> getList(StSettleDto.Request req) { return stSettleService.getList(req); }
    public StSettleDto.PageResponse getPageData(StSettleDto.Request req) { return stSettleService.getPageData(req); }

    @Transactional public StSettle create(StSettle body) { return stSettleService.create(body); }
    @Transactional public StSettle update(String id, StSettle body) { return stSettleService.update(id, body); }
    @Transactional public void delete(String id) { stSettleService.delete(id); }
    @Transactional public List<StSettle> saveList(List<StSettle> rows) { return stSettleService.saveList(rows); }

    /** changeStatus — settleStatusCd 변경 (이력 보존) */
    @Transactional
    public StSettleDto.Item changeStatus(String id, String statusCd) {
        StSettle entity = stSettleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setSettleStatusCdBefore(entity.getSettleStatusCd());
        entity.setSettleStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettle saved = stSettleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return stSettleService.getById(id);
    }
}
