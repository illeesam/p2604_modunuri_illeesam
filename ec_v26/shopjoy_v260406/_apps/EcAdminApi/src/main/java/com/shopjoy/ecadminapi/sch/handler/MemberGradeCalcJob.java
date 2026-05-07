package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * 월 구매 실적 기준 회원 등급 재산정
 * batch_code: MEMBER_GRADE_CALC
 * cron: 0 4 1 * * (매월 1일 04:00)
 */
@Slf4j
@Component
public class MemberGradeCalcJob implements SchBatchJobHandler {

    /** batchCode */
    @Override
    public String batchCode() {
        return "MEMBER_GRADE_CALC";
    }

    /** execute — 실행 */
    @Override
    public void execute(SyBatch batch) {
        log.info("[{}] 회원 등급 재산정 시작", batchCode());
        // ec_member.grade_cd 업데이트: 전월 구매 실적 기준으로 등급 재계산
        log.info("[{}] 회원 등급 재산정 완료", batchCode());
    }
}
