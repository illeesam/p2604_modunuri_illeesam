package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleAdjRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleConfigRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleEtcAdjRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleRawRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
import com.shopjoy.ecadminapi.base.sy.service.SyPropService;
import com.shopjoy.ecadminapi.co.cm.service.CmMsgSendService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 월간 정산 리포트 자동 생성 및 이메일 발송.
 * batch_code: SETTLEMENT_REPORT
 * cron: 0 8 1 * * (매월 1일 08:00)
 *
 * <p><b>처리 순서</b>:
 * <ol>
 *   <li>전월 기준 정산기간 산출 (YYYY-MM)</li>
 *   <li>사이트별 — 전월 st_settle_raw 에 원천 데이터가 있는 업체 목록 조회</li>
 *   <li>업체별 원천 집계: totalOrderAmt / totalReturnAmt / totalClaimCnt / totalDiscntAmt / commissionAmt / settleAmt</li>
 *   <li>st_settle 에 해당 (siteId, vendorId, settleYm) 레코드가 없으면 INSERT, 있으면 DRAFT 상태인 경우만 UPDATE</li>
 *   <li>승인된 정산조정(st_settle_adj) + 기타조정(st_settle_etc_adj) 집계 → adjAmt / etcAdjAmt 갱신</li>
 *   <li>finalSettleAmt = settleAmt + adjAmt(ADD) - adjAmt(DEDUCT) + etcAdjAmt(ADD) - etcAdjAmt(DEDUCT)</li>
 *   <li>관리자 이메일로 처리 결과 요약 발송</li>
 * </ol>
 *
 * <p><b>수수료율 우선순위</b>: st_settle_config.vendor_id 일치 → site_id 일치(null vendor)  → 기본 0%
 *
 * <p><b>멱등성</b>: 이미 CONFIRMED/CLOSED/PAID 상태인 st_settle 는 덮어쓰지 않는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SettlementReportJob implements SchBatchJobHandler {

    private static final DateTimeFormatter YM_FMT    = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final DateTimeFormatter YYYYMM_FMT = DateTimeFormatter.ofPattern("yyyyMM");

    /**
     * sy_prop 키 — 정산 리포트 메일 수신자 목록 (쉼표 구분, 예: "a@co.kr,b@co.kr").
     * 해당 키가 없거나 비어있으면 메일 발송을 건너뛰고 경고 로그만 남긴다.
     */
    private static final String PROP_KEY_RECIPIENTS = "batch.settle.report.recipients";

    private final SySiteRepository         siteRepository;
    private final SyPropService            syPropService;
    private final StSettleRawRepository    rawRepository;
    private final StSettleRepository       settleRepository;
    private final StSettleAdjRepository    adjRepository;
    private final StSettleEtcAdjRepository etcAdjRepository;
    private final StSettleConfigRepository configRepository;
    private final CmMsgSendService         msgSendService;

    @Override
    public String batchCode() {
        return "SETTLEMENT_REPORT";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime now      = LocalDateTime.now();
        YearMonth     prevYm   = YearMonth.now().minusMonths(1);
        String        ymLabel  = prevYm.format(YM_FMT);       // "2026-06"
        String        ymCode   = prevYm.format(YYYYMM_FMT);   // "202606" — st_settle.settle_ym

        log.info("[{}] 정산 리포트 생성 시작 — 대상 기간: {}", batchCode(), ymLabel);

        int totalVendors = 0, inserted = 0, updated = 0, skipped = 0;

        for (SySite site : siteRepository.findAll()) {
            if (!"ACTIVE".equals(site.getSiteStatusCd())) continue;
            String siteId = site.getSiteId();

            List<String> vendorIds = rawRepository.findDistinctVendorIdsBySettlePeriod(siteId, ymLabel);
            if (vendorIds.isEmpty()) {
                log.info("[{}] siteId={} — {} 원천 데이터 없음, 스킵", batchCode(), siteId, ymLabel);
                continue;
            }

            for (String vendorId : vendorIds) {
                totalVendors++;
                List<StSettleRaw> raws = rawRepository.findBySettlePeriodAndVendor(siteId, ymLabel, vendorId);

                // 집계
                long   totalOrderAmt  = 0L, totalReturnAmt = 0L, totalDiscntAmt = 0L;
                long   settleAmt      = 0L;
                int    claimCnt       = 0;
                BigDecimal commRate   = resolveCommissionRate(siteId, vendorId);

                for (StSettleRaw r : raws) {
                    if ("CLAIM".equals(r.getRawTypeCd())) {
                        totalReturnAmt += nvl(r.getItemPrice());
                        claimCnt++;
                    } else {
                        totalOrderAmt += nvl(r.getItemPrice());
                    }
                    totalDiscntAmt += nvl(r.getDiscntAmt())
                        + nvl(r.getCouponDiscntAmt())
                        + nvl(r.getPromoDiscntAmt());
                    settleAmt += nvl(r.getSettleAmt());
                }

                long commAmt = BigDecimal.valueOf(totalOrderAmt - totalReturnAmt)
                    .multiply(commRate)
                    .divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.HALF_UP)
                    .longValue();

                // 정산 기간 시작/종료일시
                LocalDateTime startDt = prevYm.atDay(1).atStartOfDay();
                LocalDateTime endDt   = prevYm.atEndOfMonth().atTime(23, 59, 59);

                // 기존 st_settle 조회
                Optional<StSettle> existing = settleRepository.findAll().stream()
                    .filter(s -> siteId.equals(s.getSiteId())
                              && vendorId.equals(s.getVendorId())
                              && ymCode.equals(s.getSettleYm()))
                    .findFirst();

                StSettle settle;
                if (existing.isEmpty()) {
                    // 신규 INSERT
                    settle = new StSettle();
                    settle.setSettleId(CmUtil.generateId("st_settle"));
                    settle.setSiteId(siteId);
                    settle.setVendorId(vendorId);
                    settle.setSettleYm(ymCode);
                    settle.setSettleStartDate(startDt);
                    settle.setSettleEndDate(endDt);
                    settle.setSettleStatusCd("DRAFT");
                    settle.setRegBy("BATCH");
                    settle.setRegDate(now);
                    inserted++;
                } else {
                    settle = existing.get();
                    String status = settle.getSettleStatusCd();
                    // CONFIRMED/CLOSED/PAID 는 덮어쓰지 않음 (멱등성)
                    if ("CONFIRMED".equals(status) || "CLOSED".equals(status) || "PAID".equals(status)) {
                        log.debug("[{}] siteId={} vendorId={} 정산 {} 상태 — 스킵",
                            batchCode(), siteId, vendorId, status);
                        skipped++;
                        continue;
                    }
                    updated++;
                }

                settle.setTotalOrderAmt(totalOrderAmt);
                settle.setTotalReturnAmt(totalReturnAmt);
                settle.setTotalClaimCnt(claimCnt);
                settle.setTotalDiscntAmt(totalDiscntAmt);
                settle.setCommissionRate(commRate);
                settle.setCommissionAmt(commAmt);
                settle.setSettleAmt(settleAmt);
                settle.setUpdBy("BATCH");
                settle.setUpdDate(now);
                settleRepository.save(settle);

                // 조정금액 집계 및 최종금액 계산
                recalcFinalAmt(settle, now);
                settleRepository.save(settle);

                // 원천 데이터에 settle_id 역연결
                for (StSettleRaw r : raws) {
                    if (r.getSettleId() == null) {
                        r.setSettleId(settle.getSettleId());
                        r.setUpdBy("BATCH");
                        r.setUpdDate(now);
                        rawRepository.save(r);
                    }
                }
            }
        }

        log.info("[{}] 집계 완료 — 업체 {}개 처리 (신규 {}건 / 갱신 {}건 / 고정상태 스킵 {}건)",
            batchCode(), totalVendors, inserted, updated, skipped);

        // 이메일 알림 발송 (실패해도 배치 자체는 성공으로 처리)
        try {
            sendReportNotification(ymLabel, totalVendors, inserted, updated, skipped, now);
        } catch (Exception e) {
            log.warn("[{}] 이메일 발송 실패 (집계는 정상 완료) — {}", batchCode(), e.getMessage());
        }

        log.info("[{}] 정산 리포트 생성 완료", batchCode());
    }

    /* ── 조정금액 집계 + finalSettleAmt 재계산 ─────────────────────── */

    private void recalcFinalAmt(StSettle settle, LocalDateTime now) {
        String settleId = settle.getSettleId();

        // 승인된 정산조정 (ADD 가산 / DEDUCT 차감)
        List<StSettleAdj> adjs = adjRepository.findApprovedBySettleId(settleId);
        long adjAmt = 0L;
        for (StSettleAdj a : adjs) {
            long amt = nvl(a.getAdjAmt());
            adjAmt += "ADD".equals(a.getAdjTypeCd()) ? amt : -amt;
        }

        // 기타조정 (ADD 가산 / DEDUCT 차감)
        List<StSettleEtcAdj> etcAdjs = etcAdjRepository.findBySettleId(settleId);
        long etcAdjAmt = 0L;
        for (StSettleEtcAdj e : etcAdjs) {
            long amt = nvl(e.getEtcAdjAmt());
            etcAdjAmt += "ADD".equals(e.getEtcAdjDirCd()) ? amt : -amt;
        }

        settle.setAdjAmt(adjAmt);
        settle.setEtcAdjAmt(etcAdjAmt);
        settle.setFinalSettleAmt(nvl(settle.getSettleAmt()) + adjAmt + etcAdjAmt);
        settle.setUpdBy("BATCH");
        settle.setUpdDate(now);
    }

    /* ── 수수료율 조회 ────────────────────────────────────────────────── */

    /**
     * 수수료율 우선순위: 업체 전용 config → 사이트 공통 config → 기본 0%
     */
    private BigDecimal resolveCommissionRate(String siteId, String vendorId) {
        return configRepository.findAll().stream()
            .filter(c -> siteId.equals(c.getSiteId()) && "Y".equals(c.getUseYn()))
            .filter(c -> vendorId.equals(c.getVendorId()) || c.getVendorId() == null)
            .sorted((a, b) -> {
                // 업체 전용(vendor_id 있음)을 사이트 공통보다 우선
                int aScore = a.getVendorId() != null ? 1 : 0;
                int bScore = b.getVendorId() != null ? 1 : 0;
                return Integer.compare(bScore, aScore);
            })
            .map(c -> c.getCommissionRate() != null ? c.getCommissionRate() : BigDecimal.ZERO)
            .findFirst()
            .orElse(BigDecimal.ZERO);
    }

    /* ── 이메일 알림 ──────────────────────────────────────────────────── */

    /**
     * sy_prop 키 {@code batch.settle.report.recipients} 에 등록된 수신자 전원에게
     * 개별 메일을 발송한다.
     *
     * <p>DB 값 예시: {@code admin@shopjoy.kr,settle@shopjoy.kr,cfo@shopjoy.kr}
     * (쉼표로 구분, 공백 허용)</p>
     *
     * <p>수신자 키 자체가 없거나 값이 비어있으면 메일을 보내지 않고 경고 로그만 남긴다.
     * 개별 수신자 발송 실패는 다음 수신자 발송에 영향을 주지 않는다.</p>
     */
    private void sendReportNotification(String ymLabel, int totalVendors,
                                        int inserted, int updated, int skipped,
                                        LocalDateTime now) {
        // 1) sy_prop 에서 수신자 목록 조회
        SyPropDto.Request req = new SyPropDto.Request();
        req.setPropKey(PROP_KEY_RECIPIENTS);
        List<SyPropDto.Item> props = syPropService.getList(req);

        if (props.isEmpty() || props.get(0).getPropValue() == null
                || props.get(0).getPropValue().isBlank()) {
            log.warn("[{}] sy_prop 키 '{}' 미등록 또는 빈값 — 정산 리포트 메일 발송 건너뜀",
                batchCode(), PROP_KEY_RECIPIENTS);
            return;
        }

        String[] recipients = props.get(0).getPropValue().split(",");

        // 2) 메일 제목/본문 구성
        String subject = "[ShopJoy] " + ymLabel + " 월간 정산 리포트 생성 완료";
        String content = ymLabel + " 월간 정산 리포트가 자동 생성되었습니다.\n\n"
            + "▶ 처리 업체: " + totalVendors + "개\n"
            + "  - 신규 생성: " + inserted + "건\n"
            + "  - 금액 갱신: " + updated + "건\n"
            + "  - 확정상태 스킵: " + skipped + "건\n\n"
            + "생성 일시: " + now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")) + "\n\n"
            + "관리자 화면에서 정산 내역을 확인하고 검토해 주세요.";

        Map<String, Object> params = Map.of(
            "ymLabel",      ymLabel,
            "totalVendors", String.valueOf(totalVendors),
            "inserted",     String.valueOf(inserted),
            "updated",      String.valueOf(updated),
            "skipped",      String.valueOf(skipped)
        );

        // 3) 수신자별 개별 발송 (한 명 실패해도 나머지는 계속)
        int sentOk = 0, sentFail = 0;
        for (String raw : recipients) {
            String addr = raw.trim();
            if (addr.isEmpty()) continue;
            try {
                msgSendService.sendMailByTemplate(
                    null,                        // siteId — null 이면 대표 사이트
                    addr,                        // 수신자 이메일
                    "SETTLE_REPORT_MAIL",        // sy_template templateCode (없으면 fallback 사용)
                    subject,                     // fallback 제목
                    content,                     // fallback 본문
                    "SETTLE",                    // refTypeCd
                    null,                        // refId
                    params
                );
                log.info("[{}] 정산 리포트 메일 발송 완료 → {}", batchCode(), addr);
                sentOk++;
            } catch (Exception e) {
                log.warn("[{}] 정산 리포트 메일 발송 실패 → {} : {}", batchCode(), addr, e.getMessage());
                sentFail++;
            }
        }
        log.info("[{}] 메일 발송 결과 — 성공 {}건 / 실패 {}건", batchCode(), sentOk, sentFail);
    }

    /* ── 유틸 ──────────────────────────────────────────────────────────── */

    private long nvl(Long v) {
        return v != null ? v : 0L;
    }
}
