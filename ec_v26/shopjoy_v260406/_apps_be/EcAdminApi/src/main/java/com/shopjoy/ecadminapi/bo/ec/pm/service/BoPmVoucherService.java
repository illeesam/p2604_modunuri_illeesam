package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherSendSnsDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmVoucherRepository;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmVoucherService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * BO 상품권 서비스 — base PmVoucherService 위임 (thin wrapper) + changeStatus + sendSns.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPmVoucherService {

    private final PmVoucherService pmVoucherService;
    private final PmVoucherRepository pmVoucherRepository;

    @PersistenceContext
    private EntityManager em;

    public PmVoucherDto.Item getById(String id) { return pmVoucherService.getById(id); }
    public List<PmVoucherDto.Item> getList(PmVoucherDto.Request req) { return pmVoucherService.getList(req); }
    public PmVoucherDto.PageResponse getPageData(PmVoucherDto.Request req) { return pmVoucherService.getPageData(req); }

    @Transactional public PmVoucher create(PmVoucher body) { return pmVoucherService.create(body); }
    @Transactional public PmVoucher update(String id, PmVoucher body) { return pmVoucherService.update(id, body); }
    @Transactional public void delete(String id) { pmVoucherService.delete(id); }
    @Transactional public void saveList(List<PmVoucher> rows) { pmVoucherService.saveList(rows); }

    /** sendSns — 전송 */
    public void sendSns(String id, PmVoucherSendSnsDto.Request req) {
        if (!pmVoucherRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        log.info("SNS 발송 요청 - voucherId={}, channel={}", id, req.getChannel());
    }

    /** changeStatus — voucherStatusCd 변경 (이력 보존) */
    @Transactional
    public PmVoucherDto.Item changeStatus(String id, String statusCd) {
        PmVoucher entity = pmVoucherRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setVoucherStatusCdBefore(entity.getVoucherStatusCd());
        entity.setVoucherStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmVoucher saved = pmVoucherRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return pmVoucherService.getById(id);
    }
}
