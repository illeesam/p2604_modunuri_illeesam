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

    /* ── secret (application.yml LICENSE_SECRET 과 동일하게 유지) ── */
    private static final String SECRET = "SJ2604-LicenseSecret-X9kQm#vLpNrTzWbYd";

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
