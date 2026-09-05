package com.shopjoy.ecBeCdn.file.service;

import com.shopjoy.ecBeCdn.common.exception.CfBizException;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnailator;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Path;

/** 이미지 썸네일 생성 — EcAdminApi(CmUploadService)와 동일한 Thumbnailator 정적 API 사용(컨벤션 통일). */
@Slf4j
@Service
public class CfThumbnailService {

    /** 정사각형 박스에 맞춰 축소(비율 유지). 목록/카드용으로 충분한 크기. */
    private static final int THUMB_SIZE = 300;

    public void makeThumbnail(Path srcPath, Path destPath) {
        try {
            Thumbnailator.createThumbnail(srcPath.toFile(), destPath.toFile(), THUMB_SIZE, THUMB_SIZE);
        } catch (IOException e) {
            log.warn("[CfThumbnailService] 썸네일 생성 실패: {} — {}", srcPath, e.getMessage());
            throw new CfBizException("썸네일 생성에 실패했습니다: " + e.getMessage());
        }
    }
}
