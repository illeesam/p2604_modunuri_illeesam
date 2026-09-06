package com.shopjoy.ecBeCdn.file.dto;

import com.shopjoy.ecBeCdn.file.entity.CfFile;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/** cf_file 목록/상세 응답 — 화면이 바로 쓸 수 있게 상대경로 대신 완성된 URL로 내려준다. */
@Getter
@Builder
public class CfFileDto {
    private String fileId;
    private String origFileNm;
    private Long fileSize;
    private String contentType;
    private String mediaTypeCd;
    private String uploaderClientId;
    private LocalDateTime regDate;
    private String fileUrl;
    private String thumbnailUrl;
    private String frameUrl;
    private String streamUrl;

    // 2026-09-06(요청사항: "이미지/동영상/썸네일류는 db id 접근방식이 아닌, 리소스경로
    // 접근방식이어야 해") — fileUrl/thumbnailUrl/frameUrl 을 CfAttachServeController
    // (/api/cdn/{*path} 캐치올)가 받는 실제 저장 경로 기반으로. streamUrl 만 Range 요청(seek)
    // 지원 때문에 ID 기반(CfStreamController) 유지.
    public static CfFileDto from(CfFile f) {
        boolean isVideo = "VIDEO".equals(f.getMediaTypeCd());
        return CfFileDto.builder()
            .fileId(f.getFileId())
            .origFileNm(f.getOrigFileNm())
            .fileSize(f.getFileSize())
            .contentType(f.getContentType())
            .mediaTypeCd(f.getMediaTypeCd())
            .uploaderClientId(f.getUploaderClientId())
            .regDate(f.getRegDate())
            .fileUrl("/api/cdn/" + f.getFilePath())
            .thumbnailUrl(f.getThumbnailPath() != null ? "/api/cdn/" + f.getThumbnailPath() : null)
            .frameUrl(f.getFramePath() != null ? "/api/cdn/" + f.getFramePath() : null)
            .streamUrl(isVideo ? "/api/cdn/serve/stream/" + f.getFileId() : null)
            .build();
    }
}
