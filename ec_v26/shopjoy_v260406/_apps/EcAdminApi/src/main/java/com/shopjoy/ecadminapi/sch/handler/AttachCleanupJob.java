package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 30일 이상 미참조 임시 첨부파일 삭제
 * batch_code: ATTACH_CLEANUP
 * cron: 0 3 * * 0 (매주 일요일 03:00)
 */
@Slf4j
@Component
public class AttachCleanupJob implements SchBatchJobHandler {

    @Override
    public String batchCode() {
        return "ATTACH_CLEANUP";
    }

    @Override
    public void execute(SyBatch batch) {
        log.info("[{}] 미사용 첨부파일 정리 시작", batchCode());
        // TODO: sy_attach 중 30일 이상 미참조 임시 파일 조회 → 스토리지 삭제 → DB 삭제
        log.info("[{}] 미사용 첨부파일 정리 완료", batchCode());
    }
}
