package com.shopjoy.ecBeBo.bo.ec.st.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleAdjApproveDto;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleAdj;
import com.shopjoy.ecBeBo.base.ec.st.repository.StSettleAdjRepository;
import com.shopjoy.ecBeBo.base.ec.st.service.StSettleAdjService;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import com.shopjoy.ecBeBo.common.util.CmUtil;

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

    /* 키조회 */
    public StSettleAdjDto.Item getById(String id) { return stSettleAdjService.getById(id); }
    /* 목록조회 */
    public List<StSettleAdjDto.Item> getList(StSettleAdjDto.Request req) { return stSettleAdjService.getList(req); }
    /* 페이지조회 */
    public BasePage<StSettleAdjDto.Item> getPageData(StSettleAdjDto.Request req) { return stSettleAdjService.getPageData(req); }

    @Transactional public StSettleAdj create(StSettleAdj body) { return stSettleAdjService.create(body); }
    @Transactional public StSettleAdj update(String id, StSettleAdj body) { return stSettleAdjService.update(id, body); }
    @Transactional public void delete(String id) { stSettleAdjService.delete(id); }
    @Transactional public void saveListBase(List<StSettleAdj> rows) { stSettleAdjService.saveListBase(rows); }

    /** approve — 승인 */
    @Transactional
    public StSettleAdjDto.Item approve(String id, StSettleAdjApproveDto.Request req) {
        // [쿼리 메서드] 정산조정 단건 조회
        StSettleAdj entity = stSettleAdjRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setAprvStatusCd(req.getAprvStatusCd() != null ? req.getAprvStatusCd() : "승인");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 정산조정 저장
        StSettleAdj saved = stSettleAdjRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return stSettleAdjService.getById(id);
    }
}
