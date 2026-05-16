package com.shopjoy.ecadminapi.common.license;

import com.shopjoy.ecadminapi.common.license.exception.LicenseException;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 라이선스 JS 파일 검증기 — Spring 없이 단독 실행.
 *
 * 실행:
 *   IntelliJ → main() 우클릭 → Run  (JS_FILE 상수를 미리 수정)
 *   또는 Gradle:
 *     ./gradlew run --args="./license-output/licenseFo-20260424_200429-BUYER_001.js"
 *
 * 인수 순서: jsFilePath [secret]
 *   jsFilePath — 검증할 라이선스 JS 파일 경로 (필수)
 *   secret     — HMAC 시크릿 (생략 시 기본값 사용)
 *
 * 검증 항목:
 *   1) JS 파일 파싱   — siteType / siteId / siteNo / buyerId / expireDate / licenseCode 추출
 *   2) 서명 검증      — HMAC-SHA256 일치 여부 (secret 없이는 위조 불가)
 *   3) 전체 필드 교차 — JS 파일의 각 값 vs licenseCode payload 내부 값 (하나라도 다르면 실패)
 *   4) 만료일 확인    — 오늘 날짜 기준
 */
public class LicenseX2VerifyMain {

    /**
     * 기본 HMAC 시크릿. {@link LicenseX1GenerateMain#SECRET} 및 서버
     * {@code app.license.secret} 과 동일해야 서명 검증이 통과한다. CLI 2번째
     * 인수로 다른 시크릿을 지정하면 그 값으로 대체된다.
     */
    /* ── secret (LicenseGenerateMain.SECRET 과 동일하게 유지) ── */
    private static final String DEFAULT_SECRET = "SJ2604-LicenseSecret-X9kQm#vLpNrTzWbYd";

    /** IntelliJ 단독 실행 시 검증할 JS 파일 경로 기본값(인수 없을 때 사용). */
    /* ── IntelliJ 직접 실행 시 여기서 수정 ── */
    private static final String JS_FILE = "./license-output/20260424_204330-licenseBo-BUYER_001.js";

    /**
     * 라이선스 JS 파일 검증 CLI 진입점.
     *
     * <p>사용법(인수 순서): {@code jsFilePath [secret]}
     * <ul>
     *   <li>{@code jsFilePath} — 검증할 라이선스 JS 파일 경로(없으면
     *       {@link #JS_FILE} 기본값)</li>
     *   <li>{@code secret} — HMAC 시크릿(없으면 {@link #DEFAULT_SECRET})</li>
     * </ul></p>
     *
     * <p>검증 단계: ① 파일 읽기 → ② {@code key:'value'} 정규식으로 필드 파싱
     * → ③ {@link LicenseUtil#verify} 로 서명+buyerId+만료 검증 후 payload Base64
     * 직접 디코딩 → ④ JS 파일 표기값 vs payload 내부값 전 필드 교차 비교(하나라도
     * 다르면 실패: 파일 메타와 서명된 실제 값의 불일치 탐지) → ⑤ 만료일 D-day
     * 계산 → 콘솔에 단계별 결과와 {@code LicenseFilter} 검증 방식 안내 출력.</p>
     *
     * <p>실패 처리: 파일 미존재/파싱 실패/서명 불일치/필드 불일치/만료 시 해당
     * 단계에서 {@code 결과: ✗} 를 출력하고 조기 반환한다(예외를 외부로 던지지
     * 않고 사람이 읽는 리포트로 종료). 만료일 형식만 깨진 경우는 경고로 처리하고
     * 진행한다.</p>
     *
     * @param args CLI 인수(위 사용법 참조)
     * @throws Exception 파싱/검증 보조 메서드에서 발생할 수 있는 일반 예외
     */
    /** main */
    public static void main(String[] args) throws Exception {

        String jsFile = JS_FILE;
        String secret = DEFAULT_SECRET;
        if (args.length >= 1) jsFile = args[0];
        if (args.length >= 2) secret = args[1];

        System.out.println();
        System.out.println("══════════════════════════════════════════════════════════");
        System.out.println("  ShopJoy 라이선스 JS 검증");
        System.out.println("══════════════════════════════════════════════════════════");
        System.out.println("  파일: " + Paths.get(jsFile).toAbsolutePath());
        System.out.println();

        /* ── 1) JS 파일 읽기 ── */
        String content;
        try {
            content = Files.readString(Paths.get(jsFile), StandardCharsets.UTF_8);
        } catch (Exception e) {
            fail("파일 읽기 실패: " + e.getMessage());
            return;
        }

        /* ── 2) 필드 파싱 ── */
        Map<String, String> f = parseJsFields(content);
        String siteType    = f.get("siteType");
        String siteId      = f.get("siteId");
        String siteNo      = f.get("siteNo");
        String buyerId     = f.get("buyerId");
        String expireDate  = f.get("expireDate");
        String licenseCode = f.get("licenseCode");

        System.out.println("  ── JS 파일 파싱 ──────────────────────────────────────");
        System.out.println("  siteType   : " + v(siteType));
        System.out.println("  siteId     : " + v(siteId));
        System.out.println("  siteNo     : " + v(siteNo));
        System.out.println("  buyerId    : " + v(buyerId));
        System.out.println("  expireDate : " + v(expireDate));
        System.out.println("  licenseCode: " + abbrev(licenseCode));
        System.out.println();

        if (licenseCode == null || siteId == null) {
            fail("필수 필드(siteId, licenseCode)를 파싱하지 못했습니다.");
            return;
        }

        /* ── 3) 서명 검증 + payload 파싱 ── */
        System.out.println("  ── 검증 결과 ──────────────────────────────────────────");
        LicensePayload payload;
        try {
            // verify()는 서명 + siteId + 만료일 검증. 여기서는 서명+파싱만 먼저.
            String[] parts = licenseCode.split("\\.", 2);
            if (parts.length != 2)
                throw new LicenseException(LicenseException.Reason.INVALID_FORMAT, "licenseCode 형식 오류 (dot 구분자 없음)");

            // 서명 검증
            LicenseUtil.verify(secret, licenseCode, buyerId);  // 서명 + buyerId + 만료일

            // payload 직접 디코딩
            String json = new String(Base64.getDecoder().decode(parts[0]), StandardCharsets.UTF_8);
            payload = LicensePayload.fromJson(json);
        } catch (LicenseException e) {
            System.out.println("  ✗ [" + e.getReason() + "] " + e.getMessage());
            System.out.println();
            printResult(false);
            return;
        }

        /* ── 4) 전체 필드 교차 검증 ── */
        System.out.println("  ✅ 서명 검증: OK");
        System.out.println();
        System.out.printf("  %-12s %-20s %-20s %-6s %s%n", "필드", "JS파일값", "payload값", "결과", "검증항목");
        System.out.println("  " + "─".repeat(72));

        boolean allMatch = true;
        allMatch &= printField("siteType",   siteType,   payload.getSiteType(),  false);
        allMatch &= printField("siteId",     siteId,     payload.getSiteId(),    false);
        allMatch &= printField("siteNo",     siteNo,     payload.getSiteNo(),    false);
        allMatch &= printField("buyerId",    buyerId,    payload.getBuyerId(),   true);
        allMatch &= printField("expireDate", expireDate, payload.getExpireDate(),false);

        System.out.println();
        if (!allMatch) {
            printResult(false);
            return;
        }

        /* ── 5) 만료일 ── */
        try {
            LocalDate expire = LocalDate.parse(expireDate, DateTimeFormatter.ISO_LOCAL_DATE);
            long daysLeft = expire.toEpochDay() - LocalDate.now().toEpochDay();
            if (daysLeft < 0) {
                System.out.println("  ✗ 만료일 초과: " + expireDate + "  (D+" + Math.abs(daysLeft) + ")");
                printResult(false);
                return;
            }
            System.out.println("  ✅ 만료일: " + expireDate + "  (D-" + daysLeft + ")");
        } catch (Exception e) {
            System.out.println("  ⚠ 만료일 파싱 오류: " + expireDate);
        }

        System.out.println();
        printResult(true);

        /* ── 필터 검증 방식 설명 ── */
        System.out.println("  LicenseFilter.java 아래 3가지 검증이 일어납니다:");
        System.out.println();
        System.out.println("  ┌─────────────┬────────────────────────────────────────────────────────┐");
        System.out.println("  │ 검증 항목    │ 방식                                                    │");
        System.out.println("  ├─────────────┼────────────────────────────────────────────────────────┤");
        System.out.println("  │ 서명         │ 헤더 X-License-Code : HMAC-SHA256 — secret 없이 위조 불가 │");
        System.out.println("  │              │ payload 전체를 커버 → siteType/siteId/siteNo 변조 시 차단│");
        System.out.println("  ├─────────────┼────────────────────────────────────────────────────────┤");
        System.out.println("  │ buyerId      │ 헤더 X-Buyer-Id vs payload 내부값 직접 비교              │");
        System.out.println("  ├─────────────┼────────────────────────────────────────────────────────┤");
        System.out.println("  │ 만료일       │ payload 의 expireDate >= 오늘                           │");
        System.out.println("  └─────────────┴────────────────────────────────────────────────────────┘");
        System.out.println();
    }

    /**
     * JS 파일 본문에서 {@code key: 'value'} 패턴을 모두 추출한다.
     *
     * <p>정규식 {@code (\\w+):\\s*'([^']*)'} 으로 단순 작은따옴표 문자열만
     * 매칭한다. 삽입 순서를 보존하기 위해 {@link LinkedHashMap} 을 쓴다(리포트
     * 출력 순서 안정화). 정식 JS 파서가 아니므로
     * {@link LicenseX1GenerateMain#buildJs} 가 생성한 단순 포맷에만 유효하다.</p>
     *
     * @param content JS 파일 전체 텍스트
     * @return 키→값 맵(삽입 순서 보존)
     */
    /* ── JS 파일에서 'key': 'value' 패턴 파싱 ── */
    private static Map<String, String> parseJsFields(String content) {
        Map<String, String> map = new LinkedHashMap<>();
        Matcher m = Pattern.compile("(\\w+):\\s*'([^']*)'").matcher(content);
        while (m.find()) map.put(m.group(1), m.group(2));
        return map;
    }

    /**
     * 한 필드의 JS파일값 vs payload값을 비교하여 표 한 줄을 출력하고 일치 여부 반환.
     *
     * <p>{@code fileVal} 이 null 이 아니고 {@code payloadVal} 과 정확히 같을 때만
     * 일치로 본다. {@code filterCheck=true} 인 필드(buyerId)는 실제
     * {@code LicenseFilter} 가 헤더로 추가 검증하는 항목임을 {@code [필터검증]}
     * 태그로 표시한다.</p>
     *
     * @param name        필드명(표시용)
     * @param fileVal     JS 파일에서 파싱한 값
     * @param payloadVal  서명된 payload 에서 디코딩한 값
     * @param filterCheck {@code LicenseFilter} 가 추가 검증하는 항목이면 true
     * @return 두 값이 일치하면 {@code true}
     */
    /** 필드명 / JS파일값 / payload값 / 결과 한 줄 출력 — 불일치 시 false 반환 */
    private static boolean printField(String name, String fileVal, String payloadVal, boolean filterCheck) {
        boolean ok = fileVal != null && fileVal.equals(payloadVal);
        String tag = filterCheck ? "[필터검증]" : "";
        System.out.printf("  %-12s %-20s %-20s %-6s %s%n",
            name, v(fileVal), v(payloadVal), ok ? "✅" : "✗ 불일치", tag);
        return ok;
    }

    /**
     * 최종 검증 결과(유효/무효) 박스를 콘솔에 출력한다.
     *
     * @param ok 전체 검증 통과 여부
     */
    /** printResult */
    private static void printResult(boolean ok) {
        System.out.println("══════════════════════════════════════════════════════════");
        System.out.println(ok ? "  결과: ✅ 유효한 라이선스" : "  결과: ✗  유효하지 않은 라이선스");
        System.out.println("══════════════════════════════════════════════════════════");
        System.out.println();
    }

    /**
     * 치명 오류 메시지를 출력하고 무효 결과 박스로 종료 표시한다.
     *
     * <p>예외를 던지지 않고 사람이 읽는 실패 리포트로 끝내기 위한 헬퍼다(파일
     * 미존재, 필수 필드 파싱 실패 등 진행 불가 상황에서 호출).</p>
     *
     * @param msg 실패 사유 메시지
     */
    /** fail */
    private static void fail(String msg) {
        System.out.println("  ✗ " + msg);
        System.out.println();
        printResult(false);
    }

    /**
     * null 안전 표시 헬퍼 — null 이면 {@code "(없음)"} 로 치환.
     *
     * @param s 원본 문자열(null 허용)
     * @return 표시용 문자열
     */
    /** v */
    private static String v(String s)       { return s != null ? s : "(없음)"; }

    /**
     * 긴 라이선스 코드를 로그용으로 축약한다(48자 초과 시 말줄임).
     *
     * @param s 원본 문자열(null 허용 → {@code "(없음)"})
     * @return 48자 이하 축약 문자열
     */
    /** abbrev */
    private static String abbrev(String s)  {
        if (s == null) return "(없음)";
        return s.length() > 48 ? s.substring(0, 48) + "…" : s;
    }
}
