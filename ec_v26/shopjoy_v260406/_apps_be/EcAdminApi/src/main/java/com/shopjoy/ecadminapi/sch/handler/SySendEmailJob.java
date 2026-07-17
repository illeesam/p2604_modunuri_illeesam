package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
import com.shopjoy.ecadminapi.co.cm.data.vo.SendResultVo;
import com.shopjoy.ecadminapi.co.cm.service.CmMsgSendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 이메일 배치 발송 Job.
 * batch_code: SY_SEND_EMAIL
 * cron: 0 9 * * * (매일 09:00)
 *
 * <p><b>발송 대상</b>:
 * <ol>
 *   <li><b>휴면 예정 안내</b> — 마지막 로그인 후 335일(휴면 30일 전) 경과, ACTIVE 회원</li>
 *   <li><b>주문 후 미리뷰 요청</b> — 별도 확장 포인트(현재 스킵, 주석 처리)</li>
 * </ol>
 *
 * <p><b>사이트 격리</b>: 활성 사이트별로 독립 처리.
 *
 * <p><b>중복 발송 방지</b>: 동일 회원에 대해 오늘 이미 SY_SEND_EMAIL 이력이 있으면
 * 발송 스킵 (syh_send_email_log 에 ref_type_cd='DORMANT_WARN' + ref_id=memberId 기준).
 * 현재 구현은 단순 재실행 안전성만 보장; 이력 중복 체크는 CmMailSendService 가 이력 저장 시
 * 확인 가능하도록 refId 에 memberId 를 전달한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SySendEmailJob implements SchBatchJobHandler {

    /* 휴면 전환 기준: 마지막 로그인 후 365일. 안내는 30일 전(335일 경과) 발송. */
    private static final int DORMANT_DAYS          = 365;
    private static final int DORMANT_WARN_DAYS     = 335;

    private final SySiteRepository  siteRepository;
    private final MbMemberRepository memberRepository;
    private final CmMsgSendService  cmMsgSendService;

    @Override
    public String batchCode() {
        return "SY_SEND_EMAIL";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime now = LocalDateTime.now();
        log.info("[{}] 이메일 배치 발송 시작", batchCode());

        int totalSent = 0, totalFail = 0;

        for (SySite site : siteRepository.findAll()) {
            if (!"ACTIVE".equals(site.getSiteStatusCd())) continue;

            String siteId = site.getSiteId();

            /* ── 1) 휴면 예정 안내 ──────────────────────────────────────── */
            LocalDateTime dormantWarnThreshold = now.minusDays(DORMANT_WARN_DAYS);
            LocalDateTime dormantThreshold     = now.minusDays(DORMANT_DAYS);

            List<MbMember> warnTargets = memberRepository
                .findDormantWarnTargets(siteId, dormantWarnThreshold, dormantThreshold);

            log.info("[{}] siteId={} 휴면예정 이메일 대상: {}명", batchCode(), siteId, warnTargets.size());

            for (MbMember member : warnTargets) {
                String email = member.getLoginId();
                if (email == null || email.isBlank()) continue;

                Map<String, Object> params = new HashMap<>();
                params.put("name",        member.getMemberNm() != null ? member.getMemberNm() : "");
                params.put("email",       email);
                params.put("dormantDays", DORMANT_DAYS);
                params.put("warnDays",    DORMANT_DAYS - DORMANT_WARN_DAYS);

                try {
                    SendResultVo result = cmMsgSendService.sendMailByTemplate(
                        siteId,
                        email,
                        "DORMANT_WARN_MAIL",
                        "[ShopJoy] 휴면 계정 전환 예정 안내",
                        buildDormantWarnContent(member),
                        "DORMANT_WARN",
                        member.getMemberId(),
                        params
                    );

                    if (Boolean.TRUE.equals(result.getSuccess())) {
                        totalSent++;
                        log.debug("[{}] 휴면예정 메일 발송 완료 — memberId={}", batchCode(), member.getMemberId());
                    } else {
                        totalFail++;
                        log.warn("[{}] 휴면예정 메일 발송 실패 — memberId={}, reason={}",
                            batchCode(), member.getMemberId(), result.getFailReason());
                    }
                } catch (Exception e) {
                    totalFail++;
                    log.error("[{}] 휴면예정 메일 발송 오류 — memberId={}", batchCode(), member.getMemberId(), e);
                }
            }

            /* ── 2) 추가 발송 시나리오 확장 포인트 ──────────────────────── */
            // TODO: 주문 7일 경과 리뷰 요청 이메일 (별도 OdOrder 조회 + REVIEW_REQUEST_MAIL 템플릿)
            // TODO: 쿠폰 만료 D-3 이메일 (PmCouponIssue 조회 + COUPON_EXPIRE_MAIL 템플릿)
        }

        log.info("[{}] 이메일 배치 발송 완료 — 성공: {}, 실패: {}", batchCode(), totalSent, totalFail);
    }

    /* ─────────────────────────────────────────────────────────────
     * 내부 헬퍼
     * ───────────────────────────────────────────────────────────── */

    private String buildDormantWarnContent(MbMember member) {
        String name = member.getMemberNm() != null ? member.getMemberNm() : "회원";
        int remainDays = DORMANT_DAYS - DORMANT_WARN_DAYS;
        return "안녕하세요 " + name + "님,\n\n"
            + "ShopJoy 서비스를 이용하신 지 오래되어 " + remainDays + "일 후 휴면 계정으로 전환될 예정입니다.\n\n"
            + "계속 서비스를 이용하시려면 ShopJoy에 로그인해주세요.\n\n"
            + "- ShopJoy 고객센터";
    }
}
