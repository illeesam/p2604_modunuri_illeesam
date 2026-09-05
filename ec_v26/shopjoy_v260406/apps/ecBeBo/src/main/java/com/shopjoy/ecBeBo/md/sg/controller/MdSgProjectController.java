package com.shopjoy.ecBeBo.md.sg.controller;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.md.sg.data.dto.MdSgSourcegenDto;
import com.shopjoy.ecBeBo.md.sg.data.dto.MdSgSourcegenHistDto;
import com.shopjoy.ecBeBo.md.sg.data.dto.MdSgProjectDto;
import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgSourcegen;
import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgSourcegenHist;
import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgProject;
import com.shopjoy.ecBeBo.md.sg.service.MdSgSourcegenService;
import com.shopjoy.ecBeBo.md.sg.service.MdSgSourcegenHistService;
import com.shopjoy.ecBeBo.md.sg.service.MdSgProjectService;
import com.shopjoy.ecBeBo.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 소스젠 프로젝트 API — /api/md/sg/project
 * FO(회원 소스젠 편집기) / BO(관리자 프로젝트 관리) 공용. 권한 구분 없이 전체 프로젝트를 조회/편집 가능
 * (md/cb 와 동일 방침 — 2026-08-24 단순화 확정).
 */
@RestController
@RequestMapping("/api/md/sg/project")
@RequiredArgsConstructor
public class MdSgProjectController {

    private final MdSgProjectService mdSgProjectService;
    private final MdSgSourcegenService mdSgSourcegenService;
    private final MdSgSourcegenHistService mdSgSourcegenHistService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<MdSgProjectDto.Item>>> list(@Valid @ModelAttribute MdSgProjectDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgProjectService.getList(req)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<BasePage<MdSgProjectDto.Item>>> page(@Valid @ModelAttribute MdSgProjectDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgProjectService.getPageData(req)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MdSgProjectDto.Item>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgProjectService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MdSgProject>> create(@Valid @RequestBody MdSgProject body) {
        return ResponseEntity.status(201).body(ApiResponse.created(mdSgProjectService.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MdSgProject>> update(@PathVariable("id") String id, @Valid @RequestBody MdSgProject body) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgProjectService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        mdSgProjectService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** getDdls — 프로젝트의 DDL 탭 목록 조회 */
    @GetMapping("/{id}/ddls")
    public ResponseEntity<ApiResponse<List<MdSgSourcegenDto.Item>>> getDdls(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgSourcegenService.getByProjectId(id)));
    }

    /** saveDdls — 프로젝트의 DDL 탭 전체 교체 저장 (+ 프로젝트 ddl_count 집계 동기화) */
    @PostMapping("/{id}/ddls")
    public ResponseEntity<ApiResponse<Void>> saveDdls(@PathVariable("id") String id, @RequestBody List<MdSgSourcegen> rows) {
        mdSgSourcegenService.replaceAll(id, rows);
        mdSgProjectService.syncDdlCount(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }

    /** getGenHists — 프로젝트의 소스 생성 이력(최신순) 조회 */
    @GetMapping("/{id}/gen-hists")
    public ResponseEntity<ApiResponse<List<MdSgSourcegenHistDto.Item>>> getGenHists(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgSourcegenHistService.getByProjectId(id)));
    }

    /**
     * addGenHist — 소스 생성 이력 1건 추가.
     * 프론트가 브라우저에서 ZIP 을 만든 뒤 공통 업로드 API 로 먼저 올리고, 받은 attachId/zipUrl 을
     * 이 API 로 넘겨 이력에 남긴다(= 생성된 소스를 DB 에 첨부 형식으로 보관).
     */
    @PostMapping("/{id}/gen-hists")
    public ResponseEntity<ApiResponse<MdSgSourcegenHist>> addGenHist(@PathVariable("id") String id,
                                                               @RequestBody MdSgSourcegenHist body) {
        MdSgSourcegenHist saved = mdSgSourcegenHistService.create(id, body);
        mdSgProjectService.markGenerated(id, body.getFileCount());
        return ResponseEntity.status(201).body(ApiResponse.created(saved));
    }

    /** genHistPage — 전체 생성이력 페이징 조회 (소스젠 경계를 넘어 이력만 모아보는 화면용) */
    @GetMapping("/gen-hists/page")
    public ResponseEntity<ApiResponse<BasePage<MdSgSourcegenHistDto.Item>>> genHistPage(
            @Valid @ModelAttribute MdSgSourcegenHistDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgSourcegenHistService.getPageData(req)));
    }

    /** deleteGenHist — 생성 이력 1건 삭제 */
    @DeleteMapping("/gen-hists/{sourcegenHistId}")
    public ResponseEntity<ApiResponse<Void>> deleteGenHist(@PathVariable("sourcegenHistId") String sourcegenHistId) {
        mdSgSourcegenHistService.delete(sourcegenHistId);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** incrementGenHistDownload — 생성 이력 그리드의 [다운로드] 클릭마다 download_count 1 증가(2026-08-30) */
    @PatchMapping("/gen-hists/{sourcegenHistId}/download")
    public ResponseEntity<ApiResponse<Integer>> incrementGenHistDownload(@PathVariable("sourcegenHistId") String sourcegenHistId) {
        return ResponseEntity.ok(ApiResponse.ok(mdSgSourcegenHistService.incrementDownloadCount(sourcegenHistId)));
    }
}
