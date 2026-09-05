package com.shopjoy.eccdnapi.file.dto;

import com.shopjoy.eccdnapi.file.entity.CfFile;
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
            .fileUrl("/cf/file/" + f.getFileId())
            .thumbnailUrl(f.getThumbnailPath() != null ? "/cf/thumbnail/" + f.getFileId() : null)
            .frameUrl(f.getFramePath() != null ? "/cf/frame/" + f.getFileId() : null)
            .streamUrl(isVideo ? "/cf/stream/" + f.getFileId() : null)
            .build();
    }
}
