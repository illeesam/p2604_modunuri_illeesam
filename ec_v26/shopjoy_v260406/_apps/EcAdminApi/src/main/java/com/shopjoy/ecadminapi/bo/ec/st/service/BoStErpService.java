package com.shopjoy.ecadminapi.bo.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecadminapi.base.ec.st.repository.StErpVoucherRepository;
import com.shopjoy.ecadminapi.base.ec.st.service.StErpVoucherService;
import com.shopjoy.ecadminapi.base.ec.st.service.StReconService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class BoStErpService {

    private final StErpVoucherService stErpVoucherService;
    private final StErpVoucherRepository stErpVoucherRepository;
    private final StReconService stReconService;

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<StErpVoucherDto> getList(Map<String, Object> p) {
        return stErpVoucherService.getList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<StErpVoucherDto> getPageData(Map<String, Object> p) {
        return stErpVoucherService.getPageData(p);
    }

    /** getReconPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<StReconDto> getReconPageData(Map<String, Object> p) {
        return stReconService.getPageData(p);
    }

    /** ERP 전표 생성 — PENDING 상태로 신규 발행 */
    @Transactional
    public StErpVoucher gen(String targetMon, String slipType) {
        StErpVoucher entity = new StErpVoucher();
        entity.setSettleYm(targetMon);
        entity.setErpVoucherTypeCd(slipType);
        entity.setErpVoucherStatusCd("PENDING");
        StErpVoucher result = stErpVoucherService.create(entity);
        log.info("ERP 전표 생성 - id={}, targetMon={}", result.getErpVoucherId(), targetMon);
        return result;
    }

    /** ERP 전표 재전송 — 상태를 PENDING으로 초기화 후 재발송 요청 */
    @Transactional
    public void resend(String id) {
        StErpVoucher entity = stErpVoucherRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 전표입니다: " + id));
        entity.setErpVoucherStatusCd("PENDING");
        entity.setErpSendDate(null);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        stErpVoucherRepository.save(entity);
        log.info("ERP 전표 재전송 요청 - slipId={}", id);
    }
}
