package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventRepository;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmEventService;
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
 * BO 이벤트 서비스 — base PmEventService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPmEventService {

    private final PmEventService pmEventService;
    private final PmEventRepository pmEventRepository;

    @PersistenceContext
    private EntityManager em;

    public PmEventDto.Item getById(String id) { return pmEventService.getById(id); }
    public List<PmEventDto.Item> getList(PmEventDto.Request req) { return pmEventService.getList(req); }
    public PmEventDto.PageResponse getPageData(PmEventDto.Request req) { return pmEventService.getPageData(req); }

    @Transactional public PmEvent create(PmEvent body) {
        if (body.getEventStatusCd() == null) body.setEventStatusCd("DRAFT");
        if (body.getUseYn() == null) body.setUseYn("Y");
        return pmEventService.create(body);
    }
    @Transactional public PmEvent update(String id, PmEvent body) { return pmEventService.update(id, body); }
    @Transactional public void delete(String id) { pmEventService.delete(id); }
    @Transactional public void saveList(List<PmEvent> rows) { pmEventService.saveList(rows); }

    /** changeStatus — eventStatusCd 변경 (이력 보존) */
    @Transactional
    public PmEventDto.Item changeStatus(String id, String statusCd) {
        PmEvent entity = pmEventRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id));
        entity.setEventStatusCdBefore(entity.getEventStatusCd());
        entity.setEventStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmEvent saved = pmEventRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return pmEventService.getById(id);
    }
}
