package com.shopjoy.ecadminapi.bo.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleAdjRepository;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleAdjService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * BO 정산조정 서비스 — base StSettleAdjService 위임 (thin wrapper) + approve.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoStSettleAdjService {

    private final StSettleAdjService stSettleAdjService;
    private final StSettleAdjRepository stSettleAdjRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettleAdjDto.Item getById(String id) { return stSettleAdjService.getById(id); }
    public List<StSettleAdjDto.Item> getList(StSettleAdjDto.Request req) { return stSettleAdjService.getList(req); }
    public StSettleAdjDto.PageResponse getPageData(StSettleAdjDto.Request req) { return stSettleAdjService.getPageData(req); }

    @Transactional public StSettleAdj create(StSettleAdj body) { return stSettleAdjService.create(body); }
    @Transactional public StSettleAdj update(String id, StSettleAdj body) { return stSettleAdjService.update(id, body); }
    @Transactional public void delete(String id) { stSettleAdjService.delete(id); }
    @Transactional public List<StSettleAdj> saveList(List<StSettleAdj> rows) { return stSettleAdjService.saveList(rows); }

    /** approve — 승인 */
    @Transactional
    public StSettleAdjDto.Item approve(String id, Map<String, Object> body) {
        StSettleAdj entity = stSettleAdjRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setAprvStatusCd((String) body.getOrDefault("aprvStatusCd", "승인"));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleAdj saved = stSettleAdjRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return stSettleAdjService.getById(id);
    }
}
