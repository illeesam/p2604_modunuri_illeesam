package com.shopjoy.ecBeCdn.file.domain;

import java.util.Set;

/** 업로드 파일의 처리 방식 분기 기준 — 확장자만으로 판정한다(content-type 은 클라이언트가 속일 수 있어 보조 참고만). */
public enum CfMediaType {
    IMAGE, VIDEO, FILE;

    private static final Set<String> IMAGE_EXTS = Set.of("jpg", "jpeg", "png", "gif", "webp", "bmp");
    private static final Set<String> VIDEO_EXTS = Set.of("mp4", "mov", "avi", "wmv", "mkv", "webm", "m4v");

    public static CfMediaType fromExt(String ext) {
        if (ext == null || ext.isBlank()) return FILE;
        String e = ext.toLowerCase();
        if (IMAGE_EXTS.contains(e)) return IMAGE;
        if (VIDEO_EXTS.contains(e)) return VIDEO;
        return FILE;
    }
}
