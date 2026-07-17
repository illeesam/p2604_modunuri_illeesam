package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDlivItem;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivItemRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhDlivStatusHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.co.cm.service.CmDeliveryTrackerService;
import com.shopjoy.ecadminapi.co.cm.service.CmEpostTrackingService;
import com.shopjoy.ecadminapi.co.cm.service.CmSweetTrackerService;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 택배사별 API 연동 배송 상태 자동 업데이트.
 * batch_code: DLIV_STATUS_SYNC
 * cron: 0 *\/2 * * * (2시간마다)
 *
 * <p>대상: dliv_status_cd IN (SHIPPED, IN_TRANSIT) 이고 outbound_tracking_no 가 있는 배송.
 *
 * <p>택배사별 API 우선순위:
 * <ol>
 *   <li>우체국(POST) — 공공데이터포털 직접 API (일 10,000건 무료)
 *       키 등록: sy_prop → app.courier.epost.service-key
 *       발급: https://www.data.go.kr/data/15035122/openapi.do</li>
 *   <li>그 외 택배사(CJ/LOTTE/HANJIN/LOGEN 등) — 스윗트래커 통합 API (월 1,000건 무료)
 *       키 등록: sy_prop → app.courier.sweettracker.api-key
 *       발급: https://info.sweettracker.co.kr</li>
 * </ol>
 * API 키 미설정 시 경고 로그 후 해당 건 스킵 (서비스 중단 없음).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OdDlivStatusSyncJob implements SchBatchJobHandler {

    private final OdDlivRepository            dlivRepository;
    private final OdDlivItemRepository        dlivItemRepository;
    private final OdhDlivStatusHistRepository histRepository;
    private final CmSweetTrackerService       sweetTrackerService;
    private final CmEpostTrackingService      epostTrackingService;
    private final CmDeliveryTrackerService    deliveryTrackerService;

    @Override
    public String batchCode() {
        return "DLIV_STATUS_SYNC";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime now = LocalDateTime.now();
        log.info("[{}] 배송 상태 동기화 시작 — 기준시각: {}", batchCode(), now);

        // 진행 중인 배송 (SHIPPED, IN_TRANSIT) 전체 조회
        List<OdDliv> targets = new ArrayList<>();
        targets.addAll(dlivRepository.findByDlivStatusCd("SHIPPED"));
        targets.addAll(dlivRepository.findByDlivStatusCd("IN_TRANSIT"));

        int checked = 0, updated = 0, skipped = 0;

        for (OdDliv dliv : targets) {
            // 송장번호·택배사 없는 건 스킵
            if (dliv.getOutboundTrackingNo() == null || dliv.getOutboundTrackingNo().isBlank()
                || dliv.getOutboundCourierCd() == null || dliv.getOutboundCourierCd().isBlank()) {
                skipped++;
                continue;
            }

            checked++;
            String newStatus = queryNewStatus(dliv);
            if (newStatus == null || newStatus.equals(dliv.getDlivStatusCd())) continue;

            changeStatus(dliv, newStatus, buildReason(dliv.getOutboundCourierCd(), newStatus), now);
            if ("DELIVERED".equals(newStatus)) {
                dliv.setDlivDate(now);
                dlivRepository.save(dliv);
            }
            updated++;
        }

        log.info("[{}] 배송 상태 동기화 완료 — 조회: {}건, 변경: {}건, 송장없음 스킵: {}건",
            batchCode(), checked, updated, skipped);
    }

    /**
     * 택배사 코드에 따라 적합한 API로 현재 배송 상태 조회.
     *
     * <ul>
     *   <li>POST → 우체국 공공데이터포털 직접 API (일 10,000건 무료)</li>
     *   <li>CJ/LOTTE/HANJIN/LOGEN → 스윗트래커 (월 1,000건 무료) → 실패 시 Delivery Tracker fallback</li>
     *   <li>기타 → Delivery Tracker (tracker.delivery, 무료 플랜)</li>
     * </ul>
     */
    private String queryNewStatus(OdDliv dliv) {
        String courierCd  = dliv.getOutboundCourierCd();
        String trackingNo = dliv.getOutboundTrackingNo();

        // 1) 우체국 — 공공데이터포털 직접 API
        if ("POST".equals(courierCd)) {
            return epostTrackingService.getDlivStatus(trackingNo);
        }

        // 2) 스윗트래커 지원 택배사 (CJ/LOTTE/HANJIN/LOGEN) — 우선 시도
        Map<String, Object> info = sweetTrackerService.getTrackingInfo(courierCd, trackingNo);
        if (info != null) {
            int level = 0;
            Object lvObj = info.get("level");
            if (lvObj instanceof Number n) level = n.intValue();
            String status = sweetTrackerService.levelToDlivStatus(level);
            if (status != null) return status;
        }

        // 3) 스윗트래커 미지원 또는 조회 실패 → Delivery Tracker fallback
        if (deliveryTrackerService.supports(courierCd)) {
            return deliveryTrackerService.getDlivStatus(courierCd, trackingNo);
        }

        return null;
    }

    private String buildReason(String courierCd, String newStatus) {
        if ("POST".equals(courierCd)) return "우체국 공공API 조회 결과 → " + newStatus;
        if (deliveryTrackerService.supports(courierCd)) return "Delivery Tracker 조회 결과 → " + newStatus;
        return "스윗트래커 조회 결과 → " + newStatus;
    }

    /** 상태 변경 + od_dliv_item 동기화 + odh_dliv_status_hist 이력 */
    private void changeStatus(OdDliv dliv, String newStatus, String reason, LocalDateTime now) {
        String prevStatus = dliv.getDlivStatusCd();

        dliv.setDlivStatusCdBefore(prevStatus);
        dliv.setDlivStatusCd(newStatus);
        dliv.setUpdDate(now);
        dlivRepository.save(dliv);

        for (OdDlivItem item : dlivItemRepository.findByDlivId(dliv.getDlivId())) {
            item.setDlivItemStatusCdBefore(item.getDlivItemStatusCd());
            item.setDlivItemStatusCd(newStatus);
            item.setUpdDate(now);
            dlivItemRepository.save(item);
        }

        OdhDlivStatusHist hist = new OdhDlivStatusHist();
        hist.setDlivStatusHistId(CmUtil.generateId("odh_dliv_status_hist"));
        hist.setSiteId(dliv.getSiteId());
        hist.setDlivId(dliv.getDlivId());
        hist.setOrderId(dliv.getOrderId());
        hist.setDlivStatusCdBefore(prevStatus);
        hist.setDlivStatusCd(newStatus);
        hist.setStatusReason(reason);
        hist.setChgUserId("BATCH");
        hist.setChgDate(now);
        hist.setRegBy("BATCH");
        hist.setRegDate(now);
        hist.setUpdBy("BATCH");
        hist.setUpdDate(now);
        histRepository.save(hist);

        log.debug("[{}] {} → {}: dlivId={} courier={} trackingNo={}",
            batchCode(), prevStatus, newStatus,
            dliv.getDlivId(), dliv.getOutboundCourierCd(), dliv.getOutboundTrackingNo());
    }
}
