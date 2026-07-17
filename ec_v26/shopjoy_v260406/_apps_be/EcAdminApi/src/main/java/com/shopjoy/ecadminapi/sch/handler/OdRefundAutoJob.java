package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdRefundRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 환불 자동 처리 배치.
 * batch_code : REFUND_AUTO
 * cron       : 0 3 * * * (매일 03:00)
 *
 * <p>처리 1 — 장기 PENDING 자동 FAILED
 * <ul>
 *   <li>refund_status_cd = 'PENDING' 이고 refund_req_date 가 {@value #PENDING_FAIL_DAYS}일 이전인 건</li>
 *   <li>→ refund_status_cd = 'FAILED', memo 에 사유 기재</li>
 * </ul>
 *
 * <p>처리 2 — 클레임 완료 후 환불 자동 COMPLT
 * <ul>
 *   <li>취소(CANCEL)/반품(RETURN) 클레임이 COMPLT 이고 철회되지 않은 건</li>
 *   <li>해당 클레임에 연결된 환불이 PENDING 이고 refund_req_date 가 {@value #AUTO_COMPLT_DAYS}일 이전인 건</li>
 *   <li>→ refund_status_cd = 'COMPLT', refund_complt_date = now</li>
 * </ul>
 *
 * <p>교환(EXCHANGE) 클레임은 상품 재발송 확인 후 수동 처리해야 하므로 제외.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OdRefundAutoJob implements SchBatchJobHandler {

    private static final int PENDING_FAIL_DAYS  = 30;
    private static final int AUTO_COMPLT_DAYS   = 7;

    private final OdRefundRepository refundRepository;
    private final OdClaimRepository  claimRepository;

    @Override
    public String batchCode() { return "REFUND_AUTO"; }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime now = LocalDateTime.now();
        log.info("[{}] 환불 자동 처리 시작", batchCode());

        int failed    = processLongPendingFailed(now);
        int completed = processClaimCompltRefund(now);

        log.info("[{}] 완료 — 자동FAILED: {}건, 자동COMPLT: {}건", batchCode(), failed, completed);
    }

    /* ── 처리 1: 장기 PENDING → FAILED ──────────────────────────────────── */

    private int processLongPendingFailed(LocalDateTime now) {
        LocalDateTime threshold = now.minusDays(PENDING_FAIL_DAYS);
        List<OdRefund> targets = refundRepository.findPendingBefore(threshold);

        for (OdRefund r : targets) {
            r.setRefundStatusCdBefore(r.getRefundStatusCd());
            r.setRefundStatusCd("FAILED");
            r.setMemo("[BATCH] 환불 요청 후 " + PENDING_FAIL_DAYS + "일 경과 — 자동 FAILED (" + now + ")");
            r.setUpdBy("BATCH");
            r.setUpdDate(now);
            refundRepository.save(r);
            log.info("[{}] 자동FAILED — refundId={} claimId={} 요청일={}",
                batchCode(), r.getRefundId(), r.getClaimId(), r.getRefundReqDate());
        }

        int count = targets.size();
        log.info("[{}] 장기PENDING→FAILED {}건 (기준: {} 이전)", batchCode(), count, threshold);
        return count;
    }

    /* ── 처리 2: 클레임 COMPLT + PENDING 환불 → COMPLT ─────────────────── */

    private int processClaimCompltRefund(LocalDateTime now) {
        LocalDateTime threshold = now.minusDays(AUTO_COMPLT_DAYS);

        List<OdClaim> claims = claimRepository.findCompltCancelReturnClaims();
        if (claims.isEmpty()) {
            log.info("[{}] 클레임→환불COMPLT 대상 없음", batchCode());
            return 0;
        }

        List<String> claimIds = claims.stream().map(c -> c.getClaimId()).toList();
        List<OdRefund> targets = refundRepository.findPendingByClaimIdsAndBefore(claimIds, threshold);

        for (OdRefund r : targets) {
            r.setRefundStatusCdBefore(r.getRefundStatusCd());
            r.setRefundStatusCd("COMPLT");
            r.setRefundCompltDate(now);
            r.setMemo("[BATCH] 클레임 완료 후 " + AUTO_COMPLT_DAYS + "일 경과 — 자동 COMPLT (" + now + ")");
            r.setUpdBy("BATCH");
            r.setUpdDate(now);
            refundRepository.save(r);
            log.info("[{}] 자동COMPLT — refundId={} claimId={} 환불금액={}원",
                batchCode(), r.getRefundId(), r.getClaimId(), r.getTotalRefundAmt());
        }

        int count = targets.size();
        log.info("[{}] 클레임→환불COMPLT {}건 (기준: {} 이전)", batchCode(), count, threshold);
        return count;
    }
}
