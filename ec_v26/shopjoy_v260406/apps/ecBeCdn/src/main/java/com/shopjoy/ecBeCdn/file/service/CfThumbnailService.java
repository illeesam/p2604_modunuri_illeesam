package com.shopjoy.ecBeCdn.file.service;

import com.shopjoy.ecBeCdn.common.exception.CfBizException;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import net.coobird.thumbnailator.filters.ImageFilter;
import org.springframework.stereotype.Service;

import java.awt.image.ConvolveOp;
import java.awt.image.Kernel;
import java.io.IOException;
import java.nio.file.Path;

/** 이미지 썸네일 생성 — EcBeBo(CmUploadService)와 동일한 Thumbnailator 라이브러리 사용(컨벤션 통일). */
@Slf4j
@Service
public class CfThumbnailService {

    /** 정사각형 박스에 맞춰 축소(비율 유지).
     *  2026-09-06(요청사항: "썸네일 이미지 선명도가 낮은데") — 300 이던 값을 800으로 상향.
     *  FO 상품 카드가 반응형 그리드라 화면폭에 따라 300px 이상으로 넓게 렌더될 수 있고,
     *  거기에 레티나/고DPI(2~3배) 배율까지 겹치면 300짜리 썸네일은 실제 표시 픽셀보다 작아
     *  브라우저가 확대(업스케일)하면서 뿌옇게 보인다 — 800이면 그런 상황에서도 원본 대비
     *  1배 이상 해상도를 유지한다(용량은 원본보다는 여전히 훨씬 작음). */
    private static final int THUMB_SIZE = 800;

    /* 2026-09-06(요청사항: "썸네일이미지 치고 일반적으로 선명하게하는 옵션으로") — 리사이즈
     * 자체가 원본을 다운샘플링하면서 필연적으로 약간 뭉개지므로(안티앨리어싱/보간), 썸네일
     * 제작에서 흔히 쓰는 표준 후처리인 언샤프닝(3x3 sharpen convolution, 대각선 제외 상하좌우
     * 가중치 -1 + 중심 5)을 리사이즈 직후 한 번 적용한다 — 커널 합이 1이라 전체 밝기는
     * 그대로 유지되고 경계선(윤곽)만 또렷해진다. ImageMagick의 -unsharp 와 같은 목적의
     * 표준적인 방식이며 과도하지 않은 무난한 강도. */
    private static final ImageFilter SHARPEN = img -> {
        float[] kernel = {
             0f, -1f,  0f,
            -1f,  5f, -1f,
             0f, -1f,  0f,
        };
        // 목적지를 null 로 넘기면 ConvolveOp 가 원본과 호환되는 결과 이미지를 알아서 만든다
        // (직접 만든 BufferedImage 를 넘기면 색상모델이 안 맞을 때 예외가 날 수 있어 회피).
        return new ConvolveOp(new Kernel(3, 3, kernel), ConvolveOp.EDGE_NO_OP, null).filter(img, null);
    };

    public void makeThumbnail(Path srcPath, Path destPath) {
        try {
            Thumbnails.of(srcPath.toFile())
                .size(THUMB_SIZE, THUMB_SIZE)
                .addFilter(SHARPEN)
                .toFile(destPath.toFile());
        } catch (IOException e) {
            log.warn("[CfThumbnailService] 썸네일 생성 실패: {} — {}", srcPath, e.getMessage());
            throw new CfBizException("썸네일 생성에 실패했습니다: " + e.getMessage());
        }
    }
}
