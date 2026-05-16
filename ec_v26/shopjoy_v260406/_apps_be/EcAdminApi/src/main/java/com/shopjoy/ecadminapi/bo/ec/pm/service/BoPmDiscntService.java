package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntRepository;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmDiscntService;
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
 * BO 할인 서비스 — base PmDiscntService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPmDiscntService {

    private final PmDiscntService pmDiscntService;
    private final PmDiscntRepository pmDiscntRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public PmDiscntDto.Item getById(String id) { return pmDiscntService.getById(id); }
    /* 목록조회 */
    public List<PmDiscntDto.Item> getList(PmDiscntDto.Request req) { return pmDiscntService.getList(req); }
    /* 페이지조회 */
    public PmDiscntDto.PageResponse getPageData(PmDiscntDto.Request req) { return pmDiscntService.getPageData(req); }

    @Transactional public PmDiscnt create(PmDiscnt body) { return pmDiscntService.create(body); }
    @Transactional public PmDiscnt update(String id, PmDiscnt body) { return pmDiscntService.update(id, body); }
    @Transactional public void delete(String id) { pmDiscntService.delete(id); }
    @Transactional public void saveList(List<PmDiscnt> rows) { pmDiscntService.saveList(rows); }

    /** changeStatus — discntStatusCd 변경 (이력 보존) */
    @Transactional
    public PmDiscntDto.Item changeStatus(String id, String statusCd) {
        PmDiscnt entity = pmDiscntRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setDiscntStatusCdBefore(entity.getDiscntStatusCd());
        entity.setDiscntStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmDiscnt saved = pmDiscntRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return pmDiscntService.getById(id);
    }
}
