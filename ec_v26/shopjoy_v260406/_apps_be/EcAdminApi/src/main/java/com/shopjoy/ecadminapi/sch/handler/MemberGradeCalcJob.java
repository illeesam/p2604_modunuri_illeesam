package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberGradeRepository;
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
 * 누적 구매금액 기준 회원 등급 자동 재산정.
 * batch_code: MEMBER_GRADE_CALC
 * cron: 0 4 1 * * (매월 1일 04:00)
 *
 * <p><b>등급 산정 기준</b>:
 * <ul>
 *   <li>{@code mb_member.total_purchase_amt} (누적 구매금액) 기준</li>
 *   <li>{@code mb_member_grade.min_purchase_amt} 이상을 만족하는 등급 중
 *       {@code grade_rank}가 가장 높은 등급으로 승급/유지/강등</li>
 *   <li>등급 기준 미등록(사이트에 grade 없음) 시 해당 사이트 스킵</li>
 * </ul>
 *
 * <p><b>대상 필터</b>:
 * <ul>
 *   <li>member_status_cd = 'ACTIVE' 인 회원만 처리</li>
 *   <li>SUSPENDED / WITHDRAWN 회원은 등급 재산정 제외</li>
 *   <li>total_purchase_amt가 null인 회원은 0으로 간주</li>
 * </ul>
 *
 * <p><b>사이트 격리</b>: 사이트별로 각각 등급 기준(mb_member_grade)을 로드하여 처리.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MemberGradeCalcJob implements SchBatchJobHandler {

    private final SySiteRepository        siteRepository;
    private final MbMemberRepository      memberRepository;
    private final MbMemberGradeRepository gradeRepository;

    @Override
    public String batchCode() {
        return "MEMBER_GRADE_CALC";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime now = LocalDateTime.now();
        log.info("[{}] 회원 등급 재산정 시작", batchCode());

        int totalChecked = 0, totalChanged = 0;

        for (SySite site : siteRepository.findAll()) {
            if (!"ACTIVE".equals(site.getSiteStatusCd())) continue;

            String siteId = site.getSiteId();

            // 이 사이트의 등급 기준 로드 (grade_rank 내림차순 — 높은 등급 먼저)
            List<MbMemberGrade> grades = gradeRepository.findActiveBySiteIdOrderByRankDesc(siteId);
            if (grades.isEmpty()) {
                log.warn("[{}] siteId={} 등록된 회원등급 없음 — 스킵", batchCode(), siteId);
                continue;
            }

            // 최하위 등급 (grade_rank 가장 낮음 = 리스트 마지막)
            String lowestGradeCd = grades.get(grades.size() - 1).getGradeCd();

            List<MbMember> members = memberRepository.findActiveForGradeCalc(siteId);
            int siteChecked = 0, siteChanged = 0;

            for (MbMember member : members) {
                siteChecked++;
                long purchaseAmt = member.getTotalPurchaseAmt() != null
                    ? member.getTotalPurchaseAmt() : 0L;

                String newGrade = resolveGrade(purchaseAmt, grades, lowestGradeCd);
                if (newGrade.equals(member.getGradeCd())) continue;

                log.debug("[{}] 등급 변경 — memberId={} {} → {} (누적구매금액: {}원)",
                    batchCode(), member.getMemberId(),
                    member.getGradeCd(), newGrade, purchaseAmt);

                member.setGradeCd(newGrade);
                member.setUpdBy("BATCH");
                member.setUpdDate(now);
                memberRepository.save(member);
                siteChanged++;
            }

            log.info("[{}] siteId={} — {}명 검토 / {}명 등급 변경",
                batchCode(), siteId, siteChecked, siteChanged);

            totalChecked += siteChecked;
            totalChanged += siteChanged;
        }

        log.info("[{}] 회원 등급 재산정 완료 — 총 {}명 검토 / {}명 등급 변경",
            batchCode(), totalChecked, totalChanged);
    }

    /**
     * 누적 구매금액으로 목표 등급 코드 결정.
     *
     * <p>grades 는 grade_rank 내림차순 (VIP → GOLD → SILVER → BASIC 순).
     * 순서대로 순회하다 최초로 min_purchase_amt 조건을 만족하는 등급 반환.
     * 아무 조건도 안 맞으면 최하위 등급.
     *
     * @param purchaseAmt  회원 누적 구매금액
     * @param grades       grade_rank DESC 정렬된 활성 등급 목록
     * @param lowestGrade  최하위 등급 코드 (fallback)
     */
    private String resolveGrade(long purchaseAmt,
                                List<MbMemberGrade> grades,
                                String lowestGrade) {
        for (MbMemberGrade grade : grades) {
            long minAmt = grade.getMinPurchaseAmt() != null ? grade.getMinPurchaseAmt() : 0L;
            if (purchaseAmt >= minAmt) {
                return grade.getGradeCd();
            }
        }
        return lowestGrade;
    }
}
