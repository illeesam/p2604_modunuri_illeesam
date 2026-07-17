package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponIssueRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.co.cm.service.CmMsgSendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * SMS/카카오 배치 발송 Job.
 * batch_code: SY_SEND_MSG
 * cron: 0 10 * * * (매일 10:00)
 *
 * <p><b>발송 대상</b>:
 * <ol>
 *   <li><b>쿠폰 만료 D-3 안내</b> — 유효기간 종료일이 오늘 + 3일인 미사용 쿠폰 보유 회원에게 카카오 알림톡</li>
 * </ol>
 *
 * <p><b>채널 선택 기준</b>: 카카오 알림톡 우선(phone 필수). phone 없으면 발송 스킵.
 *
 * <p><b>사이트 격리</b>: 활성 사이트별로 독립 처리.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SySendMsgJob implements SchBatchJobHandler {

    /* 쿠폰 만료 안내: 만료 3일 전 */
    private static final int COUPON_EXPIRE_WARN_DAYS = 3;

    private final SySiteRepository      siteRepository;
    private final MbMemberRepository    memberRepository;
    private final PmCouponRepository    couponRepository;
    private final PmCouponIssueRepository couponIssueRepository;
    private final CmMsgSendService      cmMsgSendService;

    @Override
    public String batchCode() {
        return "SY_SEND_MSG";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        log.info("[{}] SMS/카카오 배치 발송 시작", batchCode());

        int totalSent = 0, totalFail = 0, totalSkip = 0;

        for (SySite site : siteRepository.findAll()) {
            if (!"ACTIVE".equals(site.getSiteStatusCd())) continue;

            String siteId = site.getSiteId();

            /* ── 1) 쿠폰 만료 D-3 카카오 알림톡 ─────────────────────────── */
            LocalDate expireTarget = LocalDate.now().plusDays(COUPON_EXPIRE_WARN_DAYS);

            // 만료 D-3인 쿠폰 조회 (ACTIVE 상태)
            List<PmCoupon> expiringSoonCoupons = couponRepository
                .findExpiringSoon(siteId, expireTarget);

            if (!expiringSoonCoupons.isEmpty()) {
                List<String> couponIds = expiringSoonCoupons.stream()
                    .map(PmCoupon::getCouponId).collect(Collectors.toList());

                // 해당 쿠폰을 미사용으로 보유한 발급 내역 조회
                List<PmCouponIssue> unusedIssues = couponIssueRepository
                    .findUnusedByCouponIds(siteId, couponIds);

                log.info("[{}] siteId={} 쿠폰 만료 D-3 발송 대상: {}건", batchCode(), siteId, unusedIssues.size());

                // memberId별 최초 1건만 발송 (중복 방지)
                Map<String, PmCouponIssue> issueByMember = new HashMap<>();
                for (PmCouponIssue issue : unusedIssues) {
                    issueByMember.putIfAbsent(issue.getMemberId(), issue);
                }

                for (Map.Entry<String, PmCouponIssue> entry : issueByMember.entrySet()) {
                    String memberId = entry.getKey();
                    PmCouponIssue issue = entry.getValue();

                    MbMember member = memberRepository.findById(memberId).orElse(null);
                    if (member == null || !"ACTIVE".equals(member.getMemberStatusCd())) {
                        totalSkip++;
                        continue;
                    }

                    String phone = member.getMemberPhone();
                    if (phone == null || phone.isBlank()) {
                        totalSkip++;
                        log.debug("[{}] 연락처 없어 스킵 — memberId={}", batchCode(), memberId);
                        continue;
                    }

                    // 만료될 쿠폰명 찾기
                    PmCoupon coupon = expiringSoonCoupons.stream()
                        .filter(c -> c.getCouponId().equals(issue.getCouponId()))
                        .findFirst().orElse(null);
                    String couponNm = coupon != null ? coupon.getCouponNm() : "보유 쿠폰";

                    Map<String, Object> params = new HashMap<>();
                    params.put("name",       member.getMemberNm() != null ? member.getMemberNm() : "");
                    params.put("couponNm",   couponNm);
                    params.put("expireDays", COUPON_EXPIRE_WARN_DAYS);
                    params.put("expireDate", expireTarget.toString());

                    try {
                        SendResultVo result = cmMsgSendService.sendKakaoByTemplate(
                            siteId,
                            phone,
                            "COUPON_EXPIRE_KAKAO",
                            buildCouponExpireContent(member.getMemberNm(), couponNm),
                            "COUPON_EXPIRE",
                            issue.getIssueId(),
                            params
                        );

                        if (Boolean.TRUE.equals(result.getSuccess())) {
                            totalSent++;
                            log.debug("[{}] 쿠폰만료 알림 발송 완료 — memberId={}", batchCode(), memberId);
                        } else {
                            totalFail++;
                            log.warn("[{}] 쿠폰만료 알림 발송 실패 — memberId={}, reason={}",
                                batchCode(), memberId, result.getFailReason());
                        }
                    } catch (Exception e) {
                        totalFail++;
                        log.error("[{}] 쿠폰만료 알림 발송 오류 — memberId={}", batchCode(), memberId, e);
                    }
                }
            }

            /* ── 2) 추가 발송 시나리오 확장 포인트 ──────────────────────── */
            // TODO: 이벤트 당첨자 발표 문자 (PmEvent 당첨 상태 조회 + EVENT_WIN_KAKAO 템플릿)
            // TODO: 적립금 소멸 D-7 안내 (PmSaveIssue 만료 예정 조회 + CACHE_EXPIRE_KAKAO 템플릿)
        }

        log.info("[{}] SMS/카카오 배치 발송 완료 — 성공: {}, 실패: {}, 스킵: {}",
            batchCode(), totalSent, totalFail, totalSkip);
    }

    /* ─────────────────────────────────────────────────────────────
     * 내부 헬퍼
     * ───────────────────────────────────────────────────────────── */

    private String buildCouponExpireContent(String memberNm, String couponNm) {
        String name = memberNm != null ? memberNm : "회원";
        return "[ShopJoy] " + name + "님, '" + couponNm + "' 쿠폰이 "
            + COUPON_EXPIRE_WARN_DAYS + "일 후 만료됩니다. 지금 바로 사용해보세요!";
    }
}
