package com.shopjoy.ecadminapi.bo.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleCloseRepository;
import com.shopjoy.ecadminapi.base.ec.st.service.StSettleCloseService;
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
 * BO 정산마감 서비스 — base StSettleCloseService 위임 (thin wrapper) + reopen.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoStSettleCloseService {

    private final StSettleCloseService stSettleCloseService;
    private final StSettleCloseRepository stSettleCloseRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettleCloseDto.Item getById(String id) { return stSettleCloseService.getById(id); }
    public List<StSettleCloseDto.Item> getList(StSettleCloseDto.Request req) { return stSettleCloseService.getList(req); }
    public StSettleCloseDto.PageResponse getPageData(StSettleCloseDto.Request req) { return stSettleCloseService.getPageData(req); }

    @Transactional public StSettleClose create(StSettleClose body) { return stSettleCloseService.create(body); }
    @Transactional public StSettleClose update(String id, StSettleClose body) { return stSettleCloseService.update(id, body); }
    @Transactional public void delete(String id) { stSettleCloseService.delete(id); }
    @Transactional public List<StSettleClose> saveList(List<StSettleClose> rows) { return stSettleCloseService.saveList(rows); }

    /** reopen — 마감 재오픈 */
    @Transactional
    public StSettleCloseDto.Item reopen(String id) {
        StSettleClose entity = stSettleCloseRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        entity.setCloseStatusCd("OPEN");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleClose saved = stSettleCloseRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return stSettleCloseService.getById(id);
    }
}
