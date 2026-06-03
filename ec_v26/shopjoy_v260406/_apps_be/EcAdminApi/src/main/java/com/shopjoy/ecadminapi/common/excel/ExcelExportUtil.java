package com.shopjoy.ecadminapi.common.excel;

import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.ss.util.WorkbookUtil;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;

import java.lang.reflect.Field;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.function.Function;

/**
 * 엑셀(xlsx) 다운로드 공통 유틸 — SXSSF 스트리밍 기반 대용량 처리.
 *
 * <h3>메모리 전략</h3>
 * <ul>
 *   <li>SXSSFWorkbook 의 rowAccessWindow=100 — 최근 100행만 RAM 유지, 나머지는 임시 디스크 파일로 flush</li>
 *   <li>10만건 export 시 RAM 사용량 약 30~50MB 수준 (전통적 XSSFWorkbook 의 1/20)</li>
 *   <li>응답 종료 후 {@link SXSSFWorkbook#dispose()} 로 임시 파일 정리</li>
 * </ul>
 *
 * <h3>안전장치</h3>
 * <ul>
 *   <li>{@link #MAX_ROW_HARD_LIMIT} 초과 시 IllegalStateException — 비동기 잡 큐 사용 권장 안내</li>
 *   <li>Excel 시트당 1,048,576 행 제한 — 초과 시 자동 시트 분할</li>
 * </ul>
 *
 * <h3>사용 예시</h3>
 * <pre>
 * List&lt;ExcelColumn&lt;SyUserDto.Item&gt;&gt; cols = List.of(
 *     ExcelColumn.of("로그인ID", SyUserDto.Item::getLoginId),
 *     ExcelColumn.of("이름",     SyUserDto.Item::getUserNm),
 *     ExcelColumn.of("이메일",   SyUserDto.Item::getUserEmail)
 * );
 * ExcelExportUtil.writeXlsx(response, "사용자목록", "사용자", cols, rows);
 * </pre>
 */
@Slf4j
public final class ExcelExportUtil {

    /**
     * 행수 안전 상한 — 이 이상은 비동기 잡(sy_batch)으로 처리 권장.
     *
     * <h4>이 상한을 두는 이유 (메모리만의 문제가 아님)</h4>
     * <ol>
     *   <li><b>응답 시간 (UX)</b> — 동기 HTTP 요청은 브라우저/LB(nginx·ALB) 기본 타임아웃(~5분) 안에 끝나야 함.
     *       100만건은 chunk streaming 이라도 5~15분 소요 → 브라우저 끊김 또는 사용자가 새로고침.
     *       20만건은 통상 30초~2분 내 완료 → 동기 다운로드로 무리 없음.</li>
     *   <li><b>SXSSF temp 디스크</b> — RAM 윈도우 100행 외 나머지는 임시 디스크 파일로 flush.
     *       100만건 ≈ 30~80MB temp 파일. 컨테이너 임시 디스크(1~2GB)에 동시 export 5명 발생 시 폭주 위험.</li>
     *   <li><b>네트워크 / 응답 버퍼</b> — 100만건 xlsx ≈ 50~150MB.
     *       LB·프록시 응답 타임아웃·모바일/저속 회선 다운로드 도중 끊김 빈발.</li>
     *   <li><b>DB 부하</b> — chunk 1,000건 × N회 = N번의 OFFSET 쿼리.
     *       PostgreSQL 은 OFFSET 이 뒤로 갈수록 비용 증가. 운영 DB 트랜잭션 장시간 점유 위험.</li>
     *   <li><b>사용자 의도 검증</b> — 100만건은 거의 확실히 "검색조건 미입력/잘못된 조건"
     *       또는 "분석용 (별도 경로 필요)". 상한이 다시 한 번 물어보는 안전장치 역할.</li>
     *   <li><b>마이크로 백엔드 동시성</b> — 작은 pod/VM 에서 한 명의 100만건 export 가
     *       같은 pod 의 다른 사용자 응답을 느리게 만듦. 영향 반경 제한 목적.</li>
     * </ol>
     *
     * <h4>환경별 권장값</h4>
     * <ul>
     *   <li>마이크로 백엔드 (heap 256~512MB) : 50,000 ~ 100,000</li>
     *   <li>일반 서버 (heap 2~4GB)          : 200,000 ~ 500,000  ← 현재값</li>
     *   <li>풀사이즈 백엔드 (heap 8GB+)     : 1,000,000</li>
     *   <li>비동기 잡 큐 도입 시            : 무제한 (chunk + 잡 분산, 완료 시 알림)</li>
     * </ul>
     *
     * <h4>상한 초과 시 동작</h4>
     * 호출 측({@link com.shopjoy.ecadminapi.bo.sy.service.BoSyUserService#exportExcel} 등)이
     * 사전 카운트로 검증 → IllegalStateException 발생 → 사용자에게
     * "검색조건 좁히기 / 관리자에게 비동기 다운로드 요청" 메시지 노출.
     */
    public static final int MAX_ROW_HARD_LIMIT = 300_000;

    /** Excel 시트 한 장당 최대 행수 (XLSX 표준) */
    public static final int EXCEL_SHEET_MAX_ROWS = 1_048_575;

    /** SXSSF 윈도우 사이즈 (RAM 에 유지할 최근 행수) */
    public static final int SXSSF_WINDOW_SIZE = 100;

    /**
     * DB→Sheet chunk streaming 기본 청크 크기 (행수).
     * <p>각 청크 처리 후 영속성 컨텍스트 정리 → 마이크로 백엔드(256~512MB heap) 에서도 안전.
     * <p>호출 측이 별도 값을 지정하지 않으면 이 값을 사용한다.
     * <ul>
     *   <li>너무 작으면 (~100) DB 왕복 비용 증가 → 응답시간 ↑</li>
     *   <li>너무 크면 (~10,000) 한 청크 메모리 점유 ↑, em.clear() 효과 감소</li>
     *   <li>1,000 이 일반적으로 가장 균형 잡힌 값</li>
     * </ul>
     */
    public static final int EXPORT_CHUNK_SIZE = 1_000;

    /**
     * 엑셀 업로드(upsert) 행수 안전 상한.
     * <p>다운로드 상한과 동일하게 가져가는 이유:
     * <ul>
     *   <li>업로드도 동기 HTTP 요청 — 응답시간/네트워크/DB 부하 한계 동일</li>
     *   <li>다운로드 받아서 수정 후 업로드하는 흐름이므로 양쪽 상한이 같아야 일관성</li>
     * </ul>
     * 별도 정책이 필요하면 화면별로 override.
     */
    public static final int UPLOAD_MAX_ROWS = MAX_ROW_HARD_LIMIT;

    private static final DateTimeFormatter FN_TS = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    private ExcelExportUtil() {}

    /**
     * 컬럼 정의 — 헤더명 + 값 추출 함수.
     */
    public record ExcelColumn<T>(String label, Function<T, Object> valueFn) {
        public static <T> ExcelColumn<T> of(String label, Function<T, Object> fn) {
            return new ExcelColumn<>(label, fn);
        }
    }

    /**
     * 응답에 xlsx 파일을 스트리밍으로 작성한다.
     *
     * @param response   HttpServletResponse — Content-Type/Disposition 자동 설정
     * @param areaNm     영역명 (파일명 prefix) 예: "사용자목록" → "사용자목록_20260526_143012.xlsx"
     * @param sheetName  시트명 (한글 가능, 31자 제한 자동 처리)
     * @param columns    컬럼 정의 리스트
     * @param rows       데이터 리스트 (이미 메모리에 적재된 형태). 대용량은 {@link #writeXlsxStreaming} 사용 권장.
     */
    public static <T> void writeXlsx(
            HttpServletResponse response,
            String areaNm,
            String sheetName,
            List<ExcelColumn<T>> columns,
            List<T> rows
    ) {
        if (rows != null && rows.size() > MAX_ROW_HARD_LIMIT) {
            throw new IllegalStateException(
                "엑셀 다운로드 행수가 상한(" + MAX_ROW_HARD_LIMIT + ")을 초과합니다. "
                + "현재 " + rows.size() + "건. 검색조건을 좁히거나 관리자에게 비동기 다운로드를 요청하세요."
            );
        }
        setExcelResponseHeaders(response, areaNm);
        try (SXSSFWorkbook wb = new SXSSFWorkbook(SXSSF_WINDOW_SIZE)) {
            wb.setCompressTempFiles(true);
            writeSheetWithSplit(wb, sheetName, columns, rows);
            wb.write(response.getOutputStream());
            response.getOutputStream().flush();
            wb.dispose();
        } catch (Exception e) {
            log.error("[ExcelExportUtil] writeXlsx fail — area={}, sheet={}, msg={}", areaNm, sheetName, e.getMessage(), e);
            throw new RuntimeException("엑셀 다운로드 중 오류: " + e.getMessage(), e);
        }
    }

    /**
     * 스트리밍 작성 (Mapper Cursor / ResultHandler 와 함께 사용).
     * fetcher 가 행 단위로 데이터를 공급하면 즉시 시트에 추가. 메모리에 List 적재 불필요.
     *
     * @param fetcher  rowWriter 콜백을 받아 row 단위로 데이터를 제공 (예: MyBatis ResultHandler)
     */
    public static <T> void writeXlsxStreaming(
            HttpServletResponse response,
            String areaNm,
            String sheetName,
            List<ExcelColumn<T>> columns,
            java.util.function.Consumer<java.util.function.Consumer<T>> fetcher
    ) {
        setExcelResponseHeaders(response, areaNm);
        try (SXSSFWorkbook wb = new SXSSFWorkbook(SXSSF_WINDOW_SIZE)) {
            wb.setCompressTempFiles(true);
            Sheet sheet = wb.createSheet(safeSheetName(sheetName, 1));
            writeHeader(wb, sheet, columns);
            final int[] rowIdx = { 1 };
            final int[] sheetSeq = { 1 };
            final Sheet[] curSheet = { sheet };
            fetcher.accept(item -> {
                if (rowIdx[0] > EXCEL_SHEET_MAX_ROWS) {
                    sheetSeq[0]++;
                    curSheet[0] = wb.createSheet(safeSheetName(sheetName, sheetSeq[0]));
                    writeHeader(wb, curSheet[0], columns);
                    rowIdx[0] = 1;
                }
                Row r = curSheet[0].createRow(rowIdx[0]++);
                for (int c = 0; c < columns.size(); c++) {
                    setCellValue(r.createCell(c), columns.get(c).valueFn().apply(item));
                }
            });
            wb.write(response.getOutputStream());
            response.getOutputStream().flush();
            wb.dispose();
        } catch (Exception e) {
            log.error("[ExcelExportUtil] writeXlsxStreaming fail — area={}, sheet={}, msg={}", areaNm, sheetName, e.getMessage(), e);
            throw new RuntimeException("엑셀 스트리밍 다운로드 중 오류: " + e.getMessage(), e);
        }
    }

    /** 한 시트로 다 들어가면 단일 시트, 초과 시 시트1/시트2/... 로 자동 분할 */
    private static <T> void writeSheetWithSplit(
            SXSSFWorkbook wb, String sheetName,
            List<ExcelColumn<T>> columns, List<T> rows
    ) {
        int total = rows == null ? 0 : rows.size();
        int sheetCnt = total == 0 ? 1 : (int) Math.ceil((double) total / EXCEL_SHEET_MAX_ROWS);
        for (int s = 0; s < sheetCnt; s++) {
            Sheet sheet = wb.createSheet(safeSheetName(sheetName, s + 1));
            writeHeader(wb, sheet, columns);
            int start = s * EXCEL_SHEET_MAX_ROWS;
            int end = Math.min(start + EXCEL_SHEET_MAX_ROWS, total);
            int rowIdx = 1;
            for (int i = start; i < end; i++) {
                Row r = sheet.createRow(rowIdx++);
                T item = rows.get(i);
                for (int c = 0; c < columns.size(); c++) {
                    setCellValue(r.createCell(c), columns.get(c).valueFn().apply(item));
                }
            }
        }
    }

    /** 헤더 행 작성 (배경색 + 굵게 + 가운데 정렬) */
    private static <T> void writeHeader(SXSSFWorkbook wb, Sheet sheet, List<ExcelColumn<T>> columns) {
        CellStyle headerStyle = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        headerStyle.setFont(font);
        headerStyle.setFillForegroundColor(IndexedColors.SEA_GREEN.getIndex());
        headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        headerStyle.setAlignment(HorizontalAlignment.CENTER);
        headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);
        headerStyle.setBorderTop(BorderStyle.THIN);
        headerStyle.setBorderBottom(BorderStyle.THIN);
        headerStyle.setBorderLeft(BorderStyle.THIN);
        headerStyle.setBorderRight(BorderStyle.THIN);

        Row header = sheet.createRow(0);
        header.setHeightInPoints(22f);
        for (int c = 0; c < columns.size(); c++) {
            Cell cell = header.createCell(c);
            cell.setCellValue(columns.get(c).label());
            cell.setCellStyle(headerStyle);
        }
        // 헤더 행 고정 (스크롤 시 헤더 유지)
        sheet.createFreezePane(0, 1);
    }

    /** Object → Cell 값 안전 변환 */
    private static void setCellValue(Cell cell, Object value) {
        if (value == null) { cell.setBlank(); return; }
        if (value instanceof Number n)          cell.setCellValue(n.doubleValue());
        else if (value instanceof Boolean b)    cell.setCellValue(b);
        else if (value instanceof java.util.Date d)        cell.setCellValue(d);
        else if (value instanceof LocalDateTime ldt)       cell.setCellValue(ldt.toString().replace('T', ' '));
        else if (value instanceof java.time.LocalDate ld)  cell.setCellValue(ld.toString());
        else                                                cell.setCellValue(String.valueOf(value));
    }

    /** 응답 헤더 세팅 — Content-Type/Disposition (파일명 = areaNm_YYYYMMDD_HHmmss.xlsx) */
    private static void setExcelResponseHeaders(HttpServletResponse response, String areaNm) {
        String ts = LocalDateTime.now().format(FN_TS);
        String filename = (areaNm == null || areaNm.isBlank() ? "export" : areaNm) + "_" + ts + ".xlsx";
        String encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        response.setContentType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
        response.setHeader("Content-Disposition",
            "attachment; filename=\"" + filename + "\"; filename*=UTF-8''" + encoded);
        response.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    }

    /** 시트명 안전 변환 (Excel 31자 제한 + 금지문자 제거) */
    private static String safeSheetName(String name, int seq) {
        String base = (name == null || name.isBlank()) ? "Sheet" : name;
        String safe = WorkbookUtil.createSafeSheetName(base);
        if (seq > 1) safe = (safe.length() > 26 ? safe.substring(0, 26) : safe) + "_" + seq;
        return safe;
    }

    // ════════════════════════════════════════════════════════════════════════════════════════
    //  3행 헤더 메타 기반 export — 모든 도메인 공통 사용
    // ════════════════════════════════════════════════════════════════════════════════════════

    /**
     * 메타 기반 xlsx 스트리밍 export. 3행 헤더 + 데이터.
     *
     * <p><b>헤더 구조</b>:
     * <pre>
     *   Row 1: tableLabel | tableComment ............. (전체 컬럼 병합, 회색 배경, 행높이 1.5배)
     *   Row 2: ID(key)    | 역할코드 | 역할명 | ...   (한글 라벨, 진녹색 배경, 행높이 1.5배)
     *   Row 3: roleId(key)| roleCode | roleNm | ...   (필드명, 연녹색 배경, 행높이 1.5배)
     *   Row 4: RL000001   | SYS_ADMIN| ...           (데이터)
     * </pre>
     *
     * <p>업로드 시에는 Row 3 의 필드명을 헤더로 사용 → 도메인별 매핑 코드 불필요.
     *
     * @param meta     테이블/컬럼 메타정보
     * @param fetcher  rowWriter 콜백으로 데이터 공급 (chunk streaming 사용 권장)
     * @param entityClass 데이터 객체 클래스 (필드 reflection 으로 값 추출)
     */
    public static <T> void writeXlsxWithMeta(
            HttpServletResponse response,
            ExcelMetaInfo meta,
            Class<T> entityClass,
            Consumer<Consumer<T>> fetcher
    ) {
        setExcelResponseHeaders(response, meta.tableLabel());
        try (SXSSFWorkbook wb = new SXSSFWorkbook(SXSSF_WINDOW_SIZE)) {
            wb.setCompressTempFiles(true);
            Sheet sheet = wb.createSheet(safeSheetName(meta.tableLabel(), 1));
            writeMetaHeader(wb, sheet, meta);

            // 필드 reflection 캐시
            Map<String, Field> fieldMap = buildFieldMap(entityClass, meta.columns());
            int[] rowIdx = { 3 }; // Row 4 부터 데이터 (0-indexed: 3)
            Sheet[] curSheet = { sheet };
            int[] sheetSeq = { 1 };

            fetcher.accept(item -> {
                if (rowIdx[0] > EXCEL_SHEET_MAX_ROWS) {
                    sheetSeq[0]++;
                    curSheet[0] = wb.createSheet(safeSheetName(meta.tableLabel(), sheetSeq[0]));
                    writeMetaHeader(wb, curSheet[0], meta);
                    rowIdx[0] = 3;
                }
                Row r = curSheet[0].createRow(rowIdx[0]++);
                for (int c = 0; c < meta.columns().size(); c++) {
                    ColumnMeta col = meta.columns().get(c);
                    Object val = readField(item, fieldMap.get(col.fieldName()));
                    setCellValue(r.createCell(c), val);
                }
            });

            // 컬럼 너비 자동 (대략)
            for (int c = 0; c < meta.columns().size(); c++) {
                sheet.setColumnWidth(c, 18 * 256); // 18 chars * 256 units/char
            }

            wb.write(response.getOutputStream());
            response.getOutputStream().flush();
            wb.dispose();
        } catch (Exception e) {
            log.error("[ExcelExportUtil] writeXlsxWithMeta fail — table={}, msg={}", meta.tableLabel(), e.getMessage(), e);
            throw new RuntimeException("엑셀 다운로드 중 오류: " + e.getMessage(), e);
        }
    }

    /**
     * 3행 헤더 작성:
     * <ul>
     *   <li>Row 1: 테이블 라벨 + 코멘트 (전체 컬럼 병합)</li>
     *   <li>Row 2: 컬럼 한글명 (사람용)</li>
     *   <li>Row 3: 컬럼 필드명 (시스템 매핑용)</li>
     * </ul>
     * 모든 헤더 행은 기본 행높이의 1.5배(약 22pt).
     */
    private static void writeMetaHeader(SXSSFWorkbook wb, Sheet sheet, ExcelMetaInfo meta) {
        int colCount = meta.columns().size();

        // ─── Row 1: 테이블 라벨 + 코멘트 (회색 배경, 굵게, 병합)
        CellStyle row1Style = wb.createCellStyle();
        Font row1Font = wb.createFont();
        row1Font.setBold(true);
        row1Font.setFontHeightInPoints((short) 11);
        row1Style.setFont(row1Font);
        row1Style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        row1Style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        row1Style.setAlignment(HorizontalAlignment.LEFT);
        row1Style.setVerticalAlignment(VerticalAlignment.CENTER);
        row1Style.setBorderTop(BorderStyle.THIN);
        row1Style.setBorderBottom(BorderStyle.THIN);
        row1Style.setBorderLeft(BorderStyle.THIN);
        row1Style.setBorderRight(BorderStyle.THIN);

        Row row1 = sheet.createRow(0);
        row1.setHeightInPoints(22f);
        Cell row1Cell = row1.createCell(0);
        String tableTxt = meta.tableLabel();
        if (meta.tableComment() != null && !meta.tableComment().isBlank()
                && !meta.tableComment().equals(meta.tableLabel())) {
            tableTxt += " — " + meta.tableComment();
        }
        row1Cell.setCellValue(tableTxt);
        row1Cell.setCellStyle(row1Style);
        // 빈 셀들도 스타일 적용 (병합 영역 테두리 유지)
        for (int c = 1; c < colCount; c++) {
            Cell empty = row1.createCell(c);
            empty.setCellStyle(row1Style);
        }
        if (colCount > 1) {
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, colCount - 1));
        }

        // ─── Row 2: 한글 라벨 (진녹색 배경, key 컬럼은 노란색)
        CellStyle row2Style = wb.createCellStyle();
        Font row2Font = wb.createFont();
        row2Font.setBold(true);
        row2Font.setColor(IndexedColors.WHITE.getIndex());
        row2Style.setFont(row2Font);
        row2Style.setFillForegroundColor(IndexedColors.SEA_GREEN.getIndex());
        row2Style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        row2Style.setAlignment(HorizontalAlignment.CENTER);
        row2Style.setVerticalAlignment(VerticalAlignment.CENTER);
        row2Style.setBorderTop(BorderStyle.THIN);
        row2Style.setBorderBottom(BorderStyle.THIN);
        row2Style.setBorderLeft(BorderStyle.THIN);
        row2Style.setBorderRight(BorderStyle.THIN);

        CellStyle row2KeyStyle = wb.createCellStyle();
        row2KeyStyle.cloneStyleFrom(row2Style);
        row2KeyStyle.setFillForegroundColor(IndexedColors.GOLD.getIndex());
        Font row2KeyFont = wb.createFont();
        row2KeyFont.setBold(true);
        row2KeyFont.setColor(IndexedColors.BLACK.getIndex());
        row2KeyStyle.setFont(row2KeyFont);

        Row row2 = sheet.createRow(1);
        row2.setHeightInPoints(22f);
        for (int c = 0; c < colCount; c++) {
            ColumnMeta col = meta.columns().get(c);
            Cell cell = row2.createCell(c);
            cell.setCellValue(col.labelWithKey());
            cell.setCellStyle(col.isKey() ? row2KeyStyle : row2Style);
        }

        // ─── Row 3: 필드명 (연녹색 배경, key 컬럼은 연노랑)
        CellStyle row3Style = wb.createCellStyle();
        Font row3Font = wb.createFont();
        row3Font.setFontHeightInPoints((short) 9);
        row3Font.setColor(IndexedColors.GREY_50_PERCENT.getIndex());
        row3Font.setItalic(true);
        row3Style.setFont(row3Font);
        row3Style.setFillForegroundColor(IndexedColors.LIGHT_GREEN.getIndex());
        row3Style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        row3Style.setAlignment(HorizontalAlignment.CENTER);
        row3Style.setVerticalAlignment(VerticalAlignment.CENTER);
        row3Style.setBorderTop(BorderStyle.THIN);
        row3Style.setBorderBottom(BorderStyle.THIN);
        row3Style.setBorderLeft(BorderStyle.THIN);
        row3Style.setBorderRight(BorderStyle.THIN);

        CellStyle row3KeyStyle = wb.createCellStyle();
        row3KeyStyle.cloneStyleFrom(row3Style);
        row3KeyStyle.setFillForegroundColor(IndexedColors.LIGHT_YELLOW.getIndex());

        Row row3 = sheet.createRow(2);
        row3.setHeightInPoints(22f);
        for (int c = 0; c < colCount; c++) {
            ColumnMeta col = meta.columns().get(c);
            Cell cell = row3.createCell(c);
            cell.setCellValue(col.fieldNameWithKey());
            cell.setCellStyle(col.isKey() ? row3KeyStyle : row3Style);
        }

        // 데이터 행 시작점 위로 고정 (스크롤해도 헤더 보임)
        sheet.createFreezePane(0, 3);
    }

    /** 필드명 → Field 객체 매핑 캐시 빌드 */
    private static Map<String, Field> buildFieldMap(Class<?> cls, List<ColumnMeta> cols) {
        Map<String, Field> map = new HashMap<>();
        for (ColumnMeta col : cols) {
            Field f = findField(cls, col.fieldName());
            if (f != null) {
                f.setAccessible(true);
                map.put(col.fieldName(), f);
            }
        }
        return map;
    }

    /** 상속 체인 따라 필드 찾기 */
    private static Field findField(Class<?> cls, String name) {
        Class<?> c = cls;
        while (c != null && c != Object.class) {
            try { return c.getDeclaredField(name); }
            catch (NoSuchFieldException ignore) { c = c.getSuperclass(); }
        }
        return null;
    }

    /** Field reflection 값 읽기 (실패 시 null) */
    private static Object readField(Object obj, Field f) {
        if (f == null || obj == null) return null;
        try { return f.get(obj); }
        catch (IllegalAccessException e) { return null; }
    }
}
