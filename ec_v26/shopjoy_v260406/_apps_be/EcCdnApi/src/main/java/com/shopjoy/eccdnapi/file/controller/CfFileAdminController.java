package com.shopjoy.eccdnapi.file.controller;

import com.shopjoy.eccdnapi.common.response.ApiResponse;
import com.shopjoy.eccdnapi.common.response.PageResult;
import com.shopjoy.eccdnapi.file.dto.CfFileDto;
import com.shopjoy.eccdnapi.file.service.CfFileService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * cf_file 관리 화면(목록/상세 메타데이터) 전용 — permitAll(로그인 불필요, 2026-09-06). 실제 바이너리 서빙은
 * CfFileServeController(/cf/file/**, permitAll), 업로드/삭제는 CfUploadController(/api/cdn/**) 참조 —
 * 이 컨트롤러는 그 둘과 경로가 겹치지 않는 조회(GET) 전용 보조 API 만 담당한다.
 */
@RestController
@RequestMapping("/api/cdn/file")
@RequiredArgsConstructor
public class CfFileAdminController {

    private final CfFileService cfFileService;

    @GetMapping("/page")
    public ApiResponse<PageResult<CfFileDto>> page(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String mediaTypeCd,
            @RequestParam(defaultValue = "1") int pageNo,
            @RequestParam(defaultValue = "12") int pageSize) {
        return ApiResponse.ok(cfFileService.getPage(keyword, mediaTypeCd, pageNo, pageSize));
    }

    @GetMapping("/{fileId}")
    public ApiResponse<CfFileDto> get(@PathVariable String fileId) {
        return ApiResponse.ok(CfFileDto.from(cfFileService.getOrThrow(fileId)));
    }
}
