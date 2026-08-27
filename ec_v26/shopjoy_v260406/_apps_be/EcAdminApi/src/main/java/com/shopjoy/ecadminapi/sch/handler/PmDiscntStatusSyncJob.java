package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmDiscntRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 할인정책 종료일(endDate) 경과 시 ACTIVE → EXPIRED 자동 처리.
 * INACTIVE 는 "저장됐으나 미적용"(관리자 수동 비활성)이라 배치가 재활성화하지 않는다 — ACTIVE→EXPIRED 단방향만 수행.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PmDiscntStatusSyncJob implements SchBatchJobHandler {

    private final PmDiscntRepository discntRepository;

    @Override
    public String batchCode() {
        return "DISCNT_STATUS_SYNC";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDate     today = LocalDate.now();
        LocalDateTime now   = LocalDateTime.now();
        log.info("[{}] 할인정책 상태 동기화 시작 — 기준일: {}", batchCode(), today);

        List<PmDiscnt> targets = discntRepository.selectSyncTargets();
        int toExpired = 0;
        for (PmDiscnt discnt : targets) {
            if (discnt.getEndDate() == null || !today.isAfter(discnt.getEndDate())) continue;
            discnt.setDiscntStatusCdBefore(discnt.getDiscntStatusCd());
            discnt.setDiscntStatusCd("EXPIRED");
            discnt.setUpdBy("BATCH");
            discnt.setUpdDate(now);
            discntRepository.save(discnt);
            toExpired++;
        }

        log.info("[{}] 완료 — {}건 검토 / EXPIRED {}건", batchCode(), targets.size(), toExpired);
    }
}
