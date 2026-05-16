package com.shopjoy.ecadminapi.common.license;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * 라이선스 JS 파일 생성기 — Spring 없이 단독 실행.
 *
 * 실행:
 *   IntelliJ → main() 우클릭 → Run
 *   또는 Gradle:
 *     ./gradlew run --args="BUYER_001 SITE_BO_01 01 SITE_FO_01 01 2027-12-31 ./license-output"
 *
 * 인수 순서: buyerId boSiteId boSiteNo foSiteId foSiteNo expireDate [outputDir]
 *
 * 출력 파일 (outputDir 하위):
 *   licenseBo-{yyyyMMdd_HHmmss}-{buyerId}.js
 *   licenseFo-{yyyyMMdd_HHmmss}-{buyerId}.js
 */
public class LicenseX1GenerateMain {

    /**
     * HMAC 서명 비밀키. {@code application.yml} 의 {@code app.license.secret}
     * (운영 환경변수 {@code LICENSE_SECRET})와 <b>반드시 동일</b>해야 서버
     * {@code LicenseFilter} 검증을 통과한다.
     *
     * <p>보안 주의: 소스에 하드코딩된 기본 시크릿이므로 운영 시크릿과 분리·교체
     * 운영이 원칙이다. 시크릿이 노출되면 임의 라이선스 위조가 가능해진다.</p>
     */
    /* ── secret (application.yml LICENSE_SECRET 과 동일하게 유지) ── */
    private static final String SECRET = "SJ2604-LicenseSecret-X9kQm#vLpNrTzWbYd";

    /**
     * 라이선스 JS 파일 생성 CLI 진입점(BO/FO 한 쌍 동시 발급).
     *
     * <p>사용법(인수 순서):
     * {@code buyerId boSiteId boSiteNo foSiteId foSiteNo expireDate [outputDir]}</p>
     * <ul>
     *   <li>인수 6개 이상이면 {@code args[0..5]} 로 기본값을 덮어쓴다.</li>
     *   <li>7번째 인수가 있으면 출력 디렉터리({@code outputDir})로 사용한다.</li>
     *   <li>인수가 6개 미만이면 코드 내 기본값(BUYER_001 등)으로 실행 — IntelliJ
     *       단독 실행 편의용.</li>
     * </ul>
     *
     * <p>동작 순서: ① BO/FO {@link LicensePayload} 빌드 → ②
     * {@link LicenseUtil#generateCode} 로 코드 생성 → ③ 생성 직후
     * {@link LicenseUtil#verify} 로 자체 검증(발급물이 즉시 깨졌는지 조기 검출)
     * → ④ 타임스탬프 파일명으로 JS 2개 작성 → ⑤ 콘솔 요약 출력.</p>
     *
     * <p>출력: {@code outputDir} 하위에
     * {@code {yyyyMMdd_HHmmss}-licenseBo-{buyerId}.js},
     * {@code {yyyyMMdd_HHmmss}-licenseFo-{buyerId}.js}. 생성 파일은 프론트엔드
     * {@code base/license/} 에 복사하여 bo.html / index.html 에서 로드한다.</p>
     *
     * @param args CLI 인수(위 사용법 참조)
     * @throws IOException 출력 디렉터리 생성/파일 쓰기 실패 시
     */
    /** main */
    public static void main(String[] args) throws IOException {

        /* ── 기본값 (args 없이 IntelliJ에서 직접 실행 시 여기서 수정) ── */
        String buyerId    = "BUYER_001";
        String boSiteId   = "SITE_BO_01";
        String boSiteNo   = "01";
        String foSiteId   = "SITE_FO_01";
        String foSiteNo   = "01";
        String expireDate = "2026-12-31";
        String outputDir  = "./license-output";

        /* ── args 오버라이드 ── */
        if (args.length >= 6) {
            buyerId    = args[0];
            boSiteId   = args[1];
            boSiteNo   = args[2];
            foSiteId   = args[3];
            foSiteNo   = args[4];
            expireDate = args[5];
        }
        if (args.length >= 7) outputDir = args[6];

        /* ── 코드 생성 ── */
        LicensePayload boPayload = LicensePayload.builder()
            .siteType("BO").siteId(boSiteId).siteNo(boSiteNo)
            .buyerId(buyerId).expireDate(expireDate).build();

        LicensePayload foPayload = LicensePayload.builder()
            .siteType("FO").siteId(foSiteId).siteNo(foSiteNo)
            .buyerId(buyerId).expireDate(expireDate).build();

        String boCode = LicenseUtil.generateCode(SECRET, boPayload);
        String foCode = LicenseUtil.generateCode(SECRET, foPayload);

        /* ── 자체 검증 ── */
        LicenseUtil.verify(SECRET, boCode, buyerId);
        LicenseUtil.verify(SECRET, foCode, buyerId);

        /* ── JS 파일 생성 ── */
        LocalDateTime now = LocalDateTime.now();
        String ts    = now.format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String genAt = now.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        Path dir     = Paths.get(outputDir);
        Files.createDirectories(dir);

        String boFile = ts + "-licenseBo-" + buyerId + ".js";
        String foFile = ts + "-licenseFo-" + buyerId + ".js";

        Files.writeString(dir.resolve(boFile), buildJs("BO", boSiteId, boSiteNo, buyerId, expireDate, boCode, genAt, boFile), StandardCharsets.UTF_8);
        Files.writeString(dir.resolve(foFile), buildJs("FO", foSiteId, foSiteNo, buyerId, expireDate, foCode, genAt, foFile), StandardCharsets.UTF_8);

        /* ── 결과 출력 ── */
        System.out.println();
        System.out.println("══════════════════════════════════════════════════════════");
        System.out.println("  ShopJoy 라이선스 JS 생성 완료");
        System.out.println("══════════════════════════════════════════════════════════");
        System.out.println("  buyerId    : " + buyerId);
        System.out.println("  boSiteId   : " + boSiteId + " (No: " + boSiteNo + ")");
        System.out.println("  foSiteId   : " + foSiteId + " (No: " + foSiteNo + ")");
        System.out.println("  expireDate : " + expireDate);
        System.out.println("  outputDir  : " + dir.toAbsolutePath());
        System.out.println();
        System.out.println("  생성 파일:");
        System.out.println("    BO → " + boFile);
        System.out.println("    FO → " + foFile);
        System.out.println();
        System.out.println("  검증: ✅ OK");
        System.out.println("══════════════════════════════════════════════════════════");
        System.out.println();
        System.out.println("  생성된 파일을 프론트엔드 base/license/ 에 복사 후");
        System.out.println("  bo.html / index.html 에서 각각 로드하세요.");
        System.out.println();
    }

    /**
     * 프론트엔드가 로드할 라이선스 JS 파일 본문을 생성한다.
     *
     * <p>전역 객체 {@code window.SHOPJOY_LICENSE_{BO|FO}} 에 라이선스 정보와
     * {@code licenseCode} 를 등록하는 IIFE 를 만든다. boApiAxios/foApiAxios 의
     * request interceptor 가 이 전역값을 읽어 {@code X-License-Code} /
     * {@code X-Buyer-Id} 헤더로 자동 주입한다. {@code window} 부재(SSR/노드)
     * 환경에서도 깨지지 않도록 {@code typeof window} 가드를 둔다.</p>
     *
     * <p>주의: 파일 상단 주석/필드 값은 사람이 읽는 메타데이터이며, 실제 검증은
     * 오직 {@code licenseCode}(서명 포함) 로만 이뤄진다 — 주석을 손으로 고쳐도
     * 서버 검증 결과는 바뀌지 않는다.</p>
     *
     * @param siteType    사이트 유형(BO/FO) — 전역 객체 접미사로도 사용
     * @param siteId      사이트 ID
     * @param siteNo      사이트 번호
     * @param buyerId     구매자 ID
     * @param expireDate  만료일(YYYY-MM-DD)
     * @param licenseCode 서명이 포함된 최종 라이선스 코드
     * @param genAt       생성 일시 문자열(주석 메타데이터)
     * @param fileName    생성 파일명(주석 메타데이터)
     * @return JS 파일 전체 문자열(UTF-8 로 기록)
     */
    /** buildJs — 구성 */
    private static String buildJs(String siteType, String siteId, String siteNo,
                                   String buyerId, String expireDate, String licenseCode,
                                   String genAt, String fileName) {
        return "/* ShopJoy License - " + siteType + " | " + siteId + " | " + expireDate
             + " | generated: " + genAt + ", " + fileName + " */\n"
            + "(function (global) {\n"
            + "  global.SHOPJOY_LICENSE_" + siteType + " = {\n"
            + "    siteType:    '" + siteType    + "',\n"
            + "    siteId:      '" + siteId      + "',\n"
            + "    siteNo:      '" + siteNo      + "',\n"
            + "    buyerId:     '" + buyerId     + "',\n"
            + "    expireDate:  '" + expireDate  + "',\n"
            + "    licenseCode: '" + licenseCode + "',\n"
            + "  };\n"
            + "})(typeof window !== 'undefined' ? window : this);\n";
    }
}
