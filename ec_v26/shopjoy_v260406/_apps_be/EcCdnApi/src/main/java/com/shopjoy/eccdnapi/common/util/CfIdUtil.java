package com.shopjoy.eccdnapi.common.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

/** ID/저장파일명 생성 헬퍼 — 프로젝트 공통 ID 규칙(YYMMDDhhmmss + rand4)을 따른다. */
public final class CfIdUtil {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private CfIdUtil() {}

    public static String generateFileId() {
        return "CF" + LocalDateTime.now().format(ID_FMT) + String.format("%04d", (int) (Math.random() * 10000));
    }

    /** 확장자 뺀 저장 base 파일명 — 같은 초에 여러 건이 와도 안 겹치게 UUID 조각을 덧붙인다. */
    public static String generateStoredBaseName() {
        return "F" + LocalDateTime.now().format(ID_FMT) + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    /** "a.b.JPG" → "jpg". 확장자 없으면 빈 문자열. */
    public static String extractExt(String fileName) {
        if (fileName == null) return "";
        int idx = fileName.lastIndexOf('.');
        if (idx < 0 || idx == fileName.length() - 1) return "";
        return fileName.substring(idx + 1).toLowerCase();
    }
}
