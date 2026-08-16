package com.shopjoy.ecadminapi.bo.common.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyExceldownDto;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyNotiDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import com.shopjoy.ecadminapi.base.sy.repository.SyAttachRepository;
import com.shopjoy.ecadminapi.base.sy.service.SyExceldownService;
import com.shopjoy.ecadminapi.base.sy.service.SyNotiService;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainRegistry;
import com.shopjoy.ecadminapi.common.excel.ExcelDownProps;
import com.shopjoy.ecadminapi.common.excel.ExcelExportUtil;
import com.shopjoy.ecadminapi.common.excel.ExcelMetaBuilder;
import com.shopjoy.ecadminapi.common.excel.ExcelMetaInfo;
import com.shopjoy.ecadminapi.common.excel.GridColumnMetaBuilder;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.lang.reflect.Field;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * 예약(ASYNC) 엑셀 생성 실행기 — 파일로 떨어뜨리고 sy_attach 에 등록한 뒤 알림을 남긴다.
 *
 * <p><b>메모리·디스크 안전 설계</b>
 * <ul>
 *   <li>SXSSF 윈도우 100행 — 행수와 무관하게 힙 사용량이 일정하다.</li>
 *   <li>분할 저장(기본 5만행/파일) — 파일 하나를 닫을 때마다 {@code dispose()} 하므로
 *       temp 디스크 피크가 "전체"가 아니라 "파일 1개분"으로 유지된다. 2G pod 에서 중요.</li>
 *   <li>{@code dispose()} 는 항상 finally — 취소/실패 시에도 temp 파일이 남지 않는다.</li>
 *   <li>청크마다 heartbeat(독립 트랜잭션) — 살아있음을 알려 고아 오판을 막는다.</li>
 *   <li>청크마다 취소 여부 확인 — 강제취소 시 즉시 중단하고 만든 파일을 지운다.</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BoExcelDownRunner {

    private final ExcelDomainRegistry registry;
    private final ExcelDownProps props;
    private final SyExceldownService syExceldownService;
    private final SyAttachRepository syAttachRepository;
    private final SyNotiService syNotiService;
    private final ObjectMapper objectMapper;

    /** 저장 루트 — /cdn/** 로 서빙되는 물리 경로 */
    @Value("${app.file.local.physical-root:src/main/resources/static/cdn}")
    private String physicalRoot;

    /** 첨부 업무코드 — 저장 경로 attach/sy_exceldown/YYYY/YYYYMM/YYYYMMDD/ */
    private static final String BIZ_CODE = "sy_exceldown";
    private static final String REF_TABLE = "sy_exceldown";
    private static final DateTimeFormatter TS = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    /**
     * 예약 건 1개 실행.
     *
     * <p>이 메서드는 트랜잭션 밖에서 돈다 — 수 분 걸리는 작업을 한 트랜잭션으로 묶으면
     * 커넥션을 오래 점유하고 heartbeat 도 보이지 않게 된다. 상태 갱신은 각각 독립 트랜잭션이다.</p>
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public void run(String exceldownId) {
        SyExceldownDto.Item job = syExceldownService.getByIdOrNull(exceldownId);
        if (job == null) { log.warn("[ExcelRun] 대상 없음 — id={}", exceldownId); return; }

        LocalDateTime start = job.getStartDate() != null ? job.getStartDate() : LocalDateTime.now();
        List<SyAttach> saved = new ArrayList<>();

        try {
            ExcelDomainHandler handler = registry.get(job.getDomainCd());
            BaseRequest req = buildRequest(handler, job.getSearchParamJson());

            /* 화면 그리드 헤더(excelColumns)를 최우선으로 쓴다 — 요청 시점 검색조건 JSON 안에 함께 저장돼 있어
               스케줄러가 나중에 실행해도 화면과 같은 컬럼 구성으로 재현된다. */
            ExcelMetaInfo meta = resolveMeta(handler, job.getSearchParamJson());

            int splitRows = props.splitRows();
            int chunkRows = props.chunkRows();
            String areaNm = (job.getDomainNm() != null && !job.getDomainNm().isBlank())
                ? job.getDomainNm() : job.getDomainCd();

            SplitWriter writer = new SplitWriter(exceldownId, areaNm, meta, handler.itemClass(),
                                                 splitRows, saved, start);
            handler.fetchChunked(req, chunkRows, item -> writer.write(item));
            writer.close();

            if (writer.canceled) {
                cleanupFiles(saved);
                log.info("[ExcelRun] 강제취소로 중단 — id={}, 삭제파일={}", exceldownId, saved.size());
                return;
            }

            long totalSize = saved.stream().mapToLong(a -> a.getFileSize() == null ? 0 : a.getFileSize()).sum();
            SyAttach first = saved.isEmpty() ? null : saved.get(0);

            syExceldownService.finishDone(
                exceldownId, writer.written,
                first != null ? first.getFileNm() : null,
                first != null ? first.getFileSize() : null,
                saved.size(), totalSize,
                first != null ? first.getAttachId() : null,
                start, LocalDateTime.now().plusDays(props.keepDays()));

            notifyDone(job, writer.written, saved.size());
            log.info("[ExcelRun] 완료 — id={}, rows={}, files={}", exceldownId, writer.written, saved.size());

        } catch (Exception e) {
            log.error("[ExcelRun] 실패 — id={}, msg={}", exceldownId, e.getMessage(), e);
            cleanupFiles(saved);
            syExceldownService.finishFail(exceldownId, e.getMessage(), start);
            notifyFail(job, e.getMessage());
        }
    }

    /* ── 분할 writer ─────────────────────────────────────────── */

    /**
     * 행을 받아 파일로 흘려보내며, splitRows 마다 새 파일로 끊는다.
     * 파일을 끊을 때마다 dispose() 하므로 temp 디스크가 누적되지 않는다.
     */
    private class SplitWriter {
        private final String exceldownId;
        private final String areaNm;
        private final ExcelMetaInfo meta;
        private final Class<?> itemClass;
        private final int splitRows;
        private final List<SyAttach> saved;
        private final LocalDateTime start;
        private final Map<String, Field> fieldMap;

        private SXSSFWorkbook wb;
        private Sheet sheet;
        private int rowInFile;
        private int fileSeq;
        int written;
        boolean canceled;

        SplitWriter(String exceldownId, String areaNm, ExcelMetaInfo meta, Class<?> itemClass,
                    int splitRows, List<SyAttach> saved, LocalDateTime start) {
            this.exceldownId = exceldownId;
            this.areaNm = areaNm;
            this.meta = meta;
            this.itemClass = itemClass;
            this.splitRows = splitRows;
            this.saved = saved;
            this.start = start;
            this.fieldMap = ExcelExportUtil.buildFieldMap(itemClass, meta.columns());
        }

        void write(Object item) {
            if (canceled) return;
            try {
                if (wb == null) openNewFile();
                Row r = sheet.createRow(rowInFile++);
                List<com.shopjoy.ecadminapi.common.excel.ColumnMeta> cols = meta.columns();
                for (int c = 0; c < cols.size(); c++) {
                    Object v = ExcelExportUtil.readField(item, fieldMap.get(cols.get(c).fieldName()));
                    ExcelExportUtil.setCellValue(r.createCell(c), v);
                }
                written++;

                /* 청크 경계마다 heartbeat + 취소 확인 (행마다 하면 DB 부하) */
                if (written % props.chunkRows() == 0) {
                    syExceldownService.heartbeat(exceldownId, written);
                    if (syExceldownService.isCanceled(exceldownId)) { canceled = true; closeCurrent(false); return; }
                }
                /* 분할 경계 */
                if (splitRows > 0 && rowInFile - 1 >= splitRows) closeCurrent(true);

            } catch (Exception e) {
                throw new RuntimeException("엑셀 행 기록 실패: " + e.getMessage(), e);
            }
        }

        private void openNewFile() throws Exception {
            fileSeq++;
            wb = new SXSSFWorkbook(100);
            wb.setCompressTempFiles(true);
            sheet = wb.createSheet("Sheet1");
            ExcelExportUtil.writeMetaHeader(wb, sheet, meta);
            rowInFile = 3;   // 메타 헤더 3행 뒤부터 데이터
        }

        /** 현재 파일을 닫아 저장한다. persist=false 면 저장하지 않고 폐기(취소 시) */
        private void closeCurrent(boolean persist) {
            if (wb == null) return;
            try {
                if (persist) {
                    SyAttach a = persistFile(wb, areaNm, fileSeq, exceldownId);
                    if (a != null) saved.add(a);
                }
            } catch (Exception e) {
                throw new RuntimeException("엑셀 파일 저장 실패: " + e.getMessage(), e);
            } finally {
                disposeQuietly(wb);
                wb = null; sheet = null; rowInFile = 0;
            }
        }

        void close() { closeCurrent(!canceled); }
    }

    /* ── 파일 저장 ───────────────────────────────────────────── */

    /** 워크북을 물리 파일로 쓰고 sy_attach 에 등록한다 (ref_table_nm/ref_id 로 1:N 연계) */
    private SyAttach persistFile(SXSSFWorkbook wb, String areaNm, int seq, String exceldownId) throws Exception {
        LocalDateTime now = LocalDateTime.now();
        String y   = now.format(DateTimeFormatter.ofPattern("yyyy"));
        String ym  = now.format(DateTimeFormatter.ofPattern("yyyyMM"));
        String ymd = now.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        String storageDir = String.format("attach/%s/%s/%s/%s", BIZ_CODE, y, ym, ymd);
        String fileNm = String.format("%s_%s_%02d.xlsx", safeName(areaNm), now.format(TS), seq);

        String root = physicalRoot.endsWith("/") ? physicalRoot.substring(0, physicalRoot.length() - 1) : physicalRoot;
        java.nio.file.Path dir = Paths.get(root, storageDir);
        Files.createDirectories(dir);
        File out = dir.resolve(fileNm).toFile();

        try (OutputStream os = new FileOutputStream(out)) {
            wb.write(os);
            os.flush();
        }

        SyAttach attach = SyAttach.builder()
            .attachId(CmUtil.generateId("sy_attach"))
            .refTableNm(REF_TABLE)
            .refId(exceldownId)
            .fileNm(fileNm)
            .storedNm(fileNm)
            .fileExt("xlsx")
            .mimeTypeCd("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            .fileSize(out.length())
            .storageTypeCd("LOCAL")
            .storagePath(storageDir + "/" + fileNm)
            .physicalPath(out.getAbsolutePath())
            .attachUrl("/cdn/" + storageDir + "/" + fileNm)
            .build();
        return syAttachRepository.save(attach);
    }

    /** 취소/실패 시 이미 만든 파일과 attach 레코드를 되돌린다 (고아 파일 방지) */
    private void cleanupFiles(List<SyAttach> saved) {
        for (SyAttach a : saved) {
            try {
                if (a.getPhysicalPath() != null) Files.deleteIfExists(Paths.get(a.getPhysicalPath()));
            } catch (Exception e) {
                log.warn("[ExcelRun] 파일 삭제 실패 — {}", a.getPhysicalPath());
            }
            try {
                syAttachRepository.deleteById(a.getAttachId());
            } catch (Exception e) {
                log.warn("[ExcelRun] attach 삭제 실패 — {}", a.getAttachId());
            }
        }
        saved.clear();
    }

    /* ── 만료 정리 ───────────────────────────────────────────── */

    /**
     * 보관기간이 지난 엑셀 파일을 물리 삭제한다.
     *
     * <p>이력 행은 남긴다 — "누가 언제 무엇을 받아갔나" 는 계속 조회할 수 있어야 하기 때문이다.
     * 파일과 sy_attach 만 지우고 file_count 를 0 으로 만들어 화면이 "보관기간 만료" 로 표시하게 한다.</p>
     *
     * @return 정리한 요청 건수
     */
    public int cleanupExpired(int keepDays) {
        SyExceldownDto.Request req = new SyExceldownDto.Request();
        req.setExceldownStatusCd("DONE");
        req.setPageNo(1);
        req.setPageSize(500);
        req.setSort("regDate asc");

        LocalDateTime now = LocalDateTime.now();
        int cleaned = 0;
        for (SyExceldownDto.Item it : syExceldownService.getList(req)) {
            if (it.getExpireDate() == null || it.getExpireDate().isAfter(now)) continue;
            if (it.getFileCount() == null || it.getFileCount() == 0) continue;   // 이미 정리됨

            List<SyAttach> files = syAttachRepository
                .findByRefTableNmAndRefIdInOrderByRefIdAscSortOrdAscAttachIdAsc(REF_TABLE, List.of(it.getExceldownId()));
            cleanupFiles(new ArrayList<>(files));
            syExceldownService.markFilesPurged(it.getExceldownId());
            cleaned++;
        }
        return cleaned;
    }

    /* ── 알림 ────────────────────────────────────────────────── */

    private void notifyDone(SyExceldownDto.Item job, int rows, int files) {
        String title = String.format("[엑셀] %s 생성 완료 (%,d건 / %d개 파일)",
            job.getDomainNm() != null ? job.getDomainNm() : job.getDomainCd(), rows, files);
        sendNoti(job, title, "예약하신 엑셀 파일이 준비되었습니다. 알림에서 바로 내려받거나 엑셀다운로드 화면에서 확인하세요.");
    }

    private void notifyFail(SyExceldownDto.Item job, String msg) {
        String title = String.format("[엑셀] %s 생성 실패",
            job.getDomainNm() != null ? job.getDomainNm() : job.getDomainCd());
        sendNoti(job, title, "사유: " + (msg == null ? "-" : msg));
    }

    private void sendNoti(SyExceldownDto.Item job, String title, String content) {
        try {
            if (job.getRegBy() == null || job.getRegBy().isBlank()) return;
            SyNotiDto.Recv recv = new SyNotiDto.Recv();
            recv.setRecvTypeCd("USER");
            recv.setRecvId(job.getRegBy());
            recv.setRecvNm(job.getRegUserNm());

            SyNotiDto.SendReq req = new SyNotiDto.SendReq();
            req.setRecvList(List.of(recv));
            req.setNotiTypeCd("ALARM");
            req.setChannelCd("notice");
            req.setNotiTitle(title);
            req.setNotiContent(content);
            req.setLinkPage("syExceldownMng");      // 알림 클릭 → 엑셀다운로드 화면
            req.setRefId(job.getExceldownId());     // 화면에서 해당 건 선택 + 원클릭 다운로드
            syNotiService.send(req);
        } catch (Exception e) {
            /* 알림 실패가 본 작업(파일 생성)을 되돌리면 안 된다 */
            log.warn("[ExcelRun] 알림 등록 실패 — id={}, msg={}", job.getExceldownId(), e.getMessage());
        }
    }

    /* ── 내부 ────────────────────────────────────────────────── */

    /** 그리드 헤더 우선 메타 결정 — 없으면 Entity 기반으로 폴백 */
    @SuppressWarnings("unchecked")
    private ExcelMetaInfo resolveMeta(ExcelDomainHandler<?, ?, ?> handler, String searchJson) {
        try {
            if (searchJson != null && !searchJson.isBlank()) {
                Map<String, Object> map = objectMapper.readValue(searchJson, Map.class);
                Object raw = map.get(GridColumnMetaBuilder.PARAM);
                ExcelMetaInfo grid = GridColumnMetaBuilder.fromGridJson(
                    raw == null ? null : String.valueOf(raw), handler.itemClass(), handler.label(), objectMapper);
                if (grid != null) return grid;
            }
        } catch (Exception e) {
            log.warn("[ExcelRun] 그리드 메타 복원 실패 — Entity 기반으로 대체. msg={}", e.getMessage());
        }
        ExcelMetaInfo meta = handler.meta();
        return meta != null ? meta : ExcelMetaBuilder.fromEntity(handler.entityClass(), handler.itemClass());
    }

    private BaseRequest buildRequest(ExcelDomainHandler<?, ?, ?> handler, String json) throws Exception {
        if (json == null || json.isBlank()) return (BaseRequest) handler.reqClass().getDeclaredConstructor().newInstance();
        Map<String, Object> map = objectMapper.readValue(json, Map.class);
        return (BaseRequest) objectMapper.convertValue(map, handler.reqClass());
    }

    private static String safeName(String s) {
        if (s == null || s.isBlank()) return "excel";
        return s.replaceAll("[\\\\/:*?\"<>|\\s]", "_");
    }

    private static void disposeQuietly(SXSSFWorkbook wb) {
        if (wb == null) return;
        try { wb.dispose(); } catch (Exception ignored) { }
        try { wb.close(); }   catch (Exception ignored) { }
    }
}
