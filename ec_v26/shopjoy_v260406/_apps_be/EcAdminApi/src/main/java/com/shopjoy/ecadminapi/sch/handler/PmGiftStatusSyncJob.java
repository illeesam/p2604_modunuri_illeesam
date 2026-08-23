package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGift;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmGiftRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 사은품 종료일(endDate) 경과 시 ACTIVE → INACTIVE 자동 처리.
 * INACTIVE 는 "기간 종료 또는 재고 소진"을 함께 의미하는 상태라, 배치는 종료 방향만 처리하고
 * INACTIVE→ACTIVE 재활성화는 하지 않는다(재고 소진으로 비활성화된 건을 잘못 되살릴 수 있음).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PmGiftStatusSyncJob implements SchBatchJobHandler {

    private final PmGiftRepository giftRepository;

    @Override
    public String batchCode() {
        return "GIFT_STATUS_SYNC";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDate     today = LocalDate.now();
        LocalDateTime now   = LocalDateTime.now();
        log.info("[{}] 사은품 상태 동기화 시작 — 기준일: {}", batchCode(), today);

        List<PmGift> targets = giftRepository.findSyncTargets();
        int toInactive = 0;
        for (PmGift gift : targets) {
            if (gift.getEndDate() == null || !today.isAfter(gift.getEndDate())) continue;
            gift.setGiftStatusCdBefore(gift.getGiftStatusCd());
            gift.setGiftStatusCd("INACTIVE");
            gift.setUpdBy("BATCH");
            gift.setUpdDate(now);
            giftRepository.save(gift);
            toInactive++;
        }

        log.info("[{}] 완료 — {}건 검토 / INACTIVE {}건", batchCode(), targets.size(), toInactive);
    }
}
