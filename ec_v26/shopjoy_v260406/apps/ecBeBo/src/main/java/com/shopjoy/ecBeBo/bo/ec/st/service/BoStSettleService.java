package com.shopjoy.ecBeBo.bo.ec.st.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecBeBo.base.ec.st.repository.StSettleRepository;
import com.shopjoy.ecBeBo.base.ec.st.service.StSettleService;
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

    /* 키조회 */
    public StSettleDto.Item getById(String id) { return stSettleService.getById(id); }
    /* 목록조회 */
    public List<StSettleDto.Item> getList(StSettleDto.Request req) { return stSettleService.getList(req); }
    /* 페이지조회 */
    public BasePage<StSettleDto.Item> getPageData(StSettleDto.Request req) { return stSettleService.getPageData(req); }

    @Transactional public StSettle create(StSettle body) { return stSettleService.create(body); }
    @Transactional public StSettle update(String id, StSettle body) { return stSettleService.update(id, body); }
    @Transactional public void delete(String id) { stSettleService.delete(id); }
    @Transactional public void saveListBase(List<StSettle> rows) { stSettleService.saveListBase(rows); }

    /** changeStatus — settleStatusCd 변경 (이력 보존) */
    @Transactional
    public StSettleDto.Item changeStatus(String id, String statusCd) {
        // [쿼리 메서드] 정산 마스터 (업체별 월정산) 단건 조회
        StSettle entity = stSettleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setSettleStatusCdBefore(entity.getSettleStatusCd());
        entity.setSettleStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] 정산 마스터 (업체별 월정산) 저장
        StSettle saved = stSettleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return stSettleService.getById(id);
    }
}
