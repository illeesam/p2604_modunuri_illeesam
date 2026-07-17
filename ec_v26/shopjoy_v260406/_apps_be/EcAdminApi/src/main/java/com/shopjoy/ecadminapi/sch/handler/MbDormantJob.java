package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 회원 휴면 전환 배치 Job.
 * batch_code: MEMBER_DORMANT
 * cron: 0 1 * * * (매일 01:00 — COUPON_EXPIRE 이후)
 *
 * <p><b>전환 조건</b>:
 * <ul>
 *   <li>memberStatusCd = 'ACTIVE'</li>
 *   <li>lastLogin &lt;= 오늘 - 365일 (1년 이상 미로그인)</li>
 *   <li>lastLogin IS NULL 이면 regDate &lt;= 오늘 - 365일 (가입 후 한 번도 로그인하지 않은 경우)</li>
 * </ul>
 *
 * <p><b>전환 처리</b>:
 * <ul>
 *   <li>memberStatusCdBefore = 기존 'ACTIVE'</li>
 *   <li>memberStatusCd = 'DORMANT'</li>
 *   <li>updDate = 현재 시각</li>
 * </ul>
 *
 * <p>휴면 예정 안내 이메일은 별도 {@code SySendEmailJob}(SY_SEND_EMAIL, D-30)에서 발송.
 * 이 Job은 상태 전환만 담당한다.
 *
 * <p><b>사이트 격리</b>: 활성 사이트별로 독립 처리.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MbDormantJob implements SchBatchJobHandler {

    /* 1년(365일) 미로그인 시 휴면 전환 */
    private static final int DORMANT_DAYS = 365;

    private final SySiteRepository   siteRepository;
    private final MbMemberRepository memberRepository;

    @Override
    public String batchCode() {
        return "MEMBER_DORMANT";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime now       = LocalDateTime.now();
        LocalDateTime threshold = now.minusDays(DORMANT_DAYS);

        log.info("[{}] 회원 휴면 전환 배치 시작 — 기준: {} 이전 미로그인", batchCode(), threshold.toLocalDate());

        int totalConverted = 0;

        for (SySite site : siteRepository.findAll()) {
            if (!"ACTIVE".equals(site.getSiteStatusCd())) continue;

            String siteId = site.getSiteId();

            List<MbMember> targets = memberRepository.findDormantTargets(siteId, threshold);
            if (targets.isEmpty()) continue;

            int converted = 0;
            for (MbMember m : targets) {
                try {
                    m.setMemberStatusCdBefore(m.getMemberStatusCd());
                    m.setMemberStatusCd("DORMANT");
                    m.setUpdDate(now);
                    memberRepository.save(m);
                    converted++;
                } catch (Exception e) {
                    log.error("[{}] siteId={} memberId={} 휴면 전환 실패",
                        batchCode(), siteId, m.getMemberId(), e);
                }
            }

            totalConverted += converted;
            log.info("[{}] siteId={} 휴면 전환 완료 — {}건", batchCode(), siteId, converted);
        }

        log.info("[{}] 회원 휴면 전환 배치 완료 — 총 {}건 전환", batchCode(), totalConverted);
    }
}
