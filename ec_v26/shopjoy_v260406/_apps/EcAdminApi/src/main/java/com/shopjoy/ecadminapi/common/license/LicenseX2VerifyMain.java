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
public class LicenseX3VerifyMain {

    /* ── secret (LicenseGenerateMain.SECRET 과 동일하게 유지) ── */
    private static final String DEFAULT_SECRET = "SJ2604-LicenseSecret-X9kQm#vLpNrTzWbYd";

    /* ── IntelliJ 직접 실행 시 여기서 수정 ── */
    private static final String JS_FILE = "./license-output/licenseFo-20260424_200429-BUYER_001.js";

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
        boolean allMatch = true;
        allMatch &= checkField("siteType",   siteType,   payload.getSiteType());
        allMatch &= checkField("siteId",     siteId,     payload.getSiteId());
        allMatch &= checkField("siteNo",     siteNo,     payload.getSiteNo());
        allMatch &= checkField("buyerId",    buyerId,    payload.getBuyerId());
        allMatch &= checkField("expireDate", expireDate, payload.getExpireDate());

        if (!allMatch) {
            System.out.println();
            printResult(false);
            return;
        }

        System.out.println("  ✅ 서명 검증: OK");
        System.out.println("  ✅ siteType  : file=" + siteType   + "  payload=" + payload.getSiteType());
        System.out.println("  ✅ siteId    : file=" + siteId     + "  payload=" + payload.getSiteId());
        System.out.println("  ✅ siteNo    : file=" + siteNo     + "  payload=" + payload.getSiteNo());
        System.out.println("  ✅ buyerId   : file=" + buyerId    + "  payload=" + payload.getBuyerId());
        System.out.println("  ✅ expireDate: file=" + expireDate + "  payload=" + payload.getExpireDate());

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
    }

    /* ── JS 파일에서 'key': 'value' 패턴 파싱 ── */
    private static Map<String, String> parseJsFields(String content) {
        Map<String, String> map = new LinkedHashMap<>();
        Matcher m = Pattern.compile("(\\w+):\\s*'([^']*)'").matcher(content);
        while (m.find()) map.put(m.group(1), m.group(2));
        return map;
    }

    /** JS 파일 값 vs payload 값 비교 — 불일치 시 콘솔 출력 후 false 반환 */
    private static boolean checkField(String name, String fileVal, String payloadVal) {
        if (fileVal == null || !fileVal.equals(payloadVal)) {
            System.out.println("  ✗ " + name + " 불일치: file=" + v(fileVal) + "  payload=" + v(payloadVal));
            return false;
        }
        return true;
    }

    private static void printResult(boolean ok) {
        System.out.println("══════════════════════════════════════════════════════════");
        System.out.println(ok ? "  결과: ✅ 유효한 라이선스" : "  결과: ✗  유효하지 않은 라이선스");
        System.out.println("══════════════════════════════════════════════════════════");
        System.out.println();
    }

    private static void fail(String msg) {
        System.out.println("  ✗ " + msg);
        System.out.println();
        printResult(false);
    }

    private static String v(String s)       { return s != null ? s : "(없음)"; }
    private static String abbrev(String s)  {
        if (s == null) return "(없음)";
        return s.length() > 48 ? s.substring(0, 48) + "…" : s;
    }
}
