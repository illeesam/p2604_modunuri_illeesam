package com.shopjoy.eccdnapi.file.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

/** 업로드 응답 — EcAdminApi 가 sy_attach 에 그대로 옮겨 담을 수 있는 형태로 URL까지 만들어 내려준다. */
@Getter
@AllArgsConstructor
public class CfUploadResponse {
    private String fileId;
    private String origFileNm;
    private String mediaTypeCd;
    private Long fileSize;
    private String fileUrl;        // GET /cf/file/{fileId}
    private String thumbnailUrl;   // GET /cf/thumbnail/{fileId} (없으면 null)
    private String frameUrl;       // GET /cf/frame/{fileId} (동영상 아니면 null)
    private String streamUrl;      // GET /cf/stream/{fileId} (동영상만, 아니면 null)
}
