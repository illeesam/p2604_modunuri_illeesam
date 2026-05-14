package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmGiftRepository;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmGiftService;
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
 * BO 사은품 서비스 — base PmGiftService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPmGiftService {

    private final PmGiftService pmGiftService;
    private final PmGiftRepository pmGiftRepository;

    @PersistenceContext
    private EntityManager em;

    public PmGiftDto.Item getById(String id) { return pmGiftService.getById(id); }
    public List<PmGiftDto.Item> getList(PmGiftDto.Request req) { return pmGiftService.getList(req); }
    public PmGiftDto.PageResponse getPageData(PmGiftDto.Request req) { return pmGiftService.getPageData(req); }

    @Transactional public PmGift create(PmGift body) { return pmGiftService.create(body); }
    @Transactional public PmGift update(String id, PmGift body) { return pmGiftService.update(id, body); }
    @Transactional public void delete(String id) { pmGiftService.delete(id); }
    @Transactional public void saveList(List<PmGift> rows) { pmGiftService.saveList(rows); }

    /** changeStatus — giftStatusCd 변경 (이력 보존) */
    @Transactional
    public PmGiftDto.Item changeStatus(String id, String statusCd) {
        PmGift entity = pmGiftRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setGiftStatusCdBefore(entity.getGiftStatusCd());
        entity.setGiftStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmGift saved = pmGiftRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return pmGiftService.getById(id);
    }
}
