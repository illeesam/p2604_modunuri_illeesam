package com.shopjoy.ecadminapi.bo.common.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainRegistry;
import com.shopjoy.ecadminapi.common.excel.ExcelMetaBuilder;
import com.shopjoy.ecadminapi.common.excel.ExcelMetaInfo;
import com.shopjoy.ecadminapi.common.excel.ExcelUpsertService;
import com.shopjoy.ecadminapi.common.excel.ExcelExportUtil;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 엑셀 다운로드/존재체크/업로드의 단일 처리 서비스.
 *
 * <p>{@link com.shopjoy.ecadminapi.bo.common.controller.BoExcelController} 의 모든
 * 엔드포인트가 이 서비스로 위임. 도메인별 차이는 {@link ExcelDomainHandler} 가 흡수.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoExcelService {

    private final ExcelDomainRegistry registry;
    private final ExcelUpsertService excelUpsertService;
    private final ObjectMapper objectMapper;

    /** 도메인 다운로드 — chunk streaming + 메타 헤더 */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public void exportExcel(String domainKey, Map<String, Object> queryParams, HttpServletResponse response) {
        ExcelDomainHandler handler = registry.get(domainKey);

        BaseRequest req = (BaseRequest) objectMapper.convertValue(queryParams, handler.reqClass());

        long total = handler.countList(req);
        if (total > ExcelExportUtil.MAX_ROW_HARD_LIMIT) {
            throw new IllegalStateException(
                "엑셀 다운로드 행수가 상한(" + ExcelExportUtil.MAX_ROW_HARD_LIMIT + ")을 초과합니다. "
                + "현재 " + total + "건. 검색조건을 좁히거나 관리자에게 비동기 다운로드를 요청하세요."
            );
        }

        ExcelMetaInfo meta = handler.meta();
        if (meta == null) {
            meta = ExcelMetaBuilder.fromEntity(handler.entityClass(), handler.itemClass());
        }

        ExcelExportUtil.writeXlsxWithMeta(response, meta, handler.itemClass(),
            rowWriter -> handler.fetchChunked(req, ExcelExportUtil.EXPORT_CHUNK_SIZE, rowWriter::accept)
        );
    }

    /** 키 일괄 존재체크 */
    public Map<String, Boolean> existsCheck(String domainKey, List<String> keys) {
        ExcelDomainHandler<?, ?, ?> handler = registry.get(domainKey);
        return excelUpsertService.existsCheck(handler.repository(), keys);
    }

    /** 업로드(upsert) — 키 유무로 INSERT/UPDATE 자동 판정 */
    @SuppressWarnings({"unchecked", "rawtypes"})
    @Transactional
    public Map<String, Object> upsertList(String domainKey, List<Map<String, Object>> rows) {
        return upsertList(domainKey, rows, false);
    }

    /** upsertList — testRun=true 면 정상 처리 흐름을 모두 수행한 뒤 트랜잭션 롤백 → DB 미반영.
     *  프론트 [업로드점검] 버튼이 이 모드로 호출하여 행별 검증 결과를 받아간다. */
    @SuppressWarnings({"unchecked", "rawtypes"})
    @Transactional
    public Map<String, Object> upsertList(String domainKey, List<Map<String, Object>> rows, boolean testRun) {
        ExcelDomainHandler handler = registry.get(domainKey);
        Map<String, Object> result = excelUpsertService.upsertByKey(
            handler.entityClass(), handler.repository(), rows, null, testRun
        );
        /* testRun 에서는 후처리(캐시 무효화 등) 건너뜀 — 실제 변경이 없으므로 */
        if (!testRun) {
            handler.afterUpsert(result);
        }
        return result;
    }

    /** 도메인 메타 목록 — 프론트 select 동적 생성용 */
    public Map<String, Object> domainList() {
        Map<String, Object> out = new HashMap<>();
        out.put("domains", registry.listAll());
        return out;
    }

    /**
     * 단일 도메인의 컬럼 메타 — 프론트가 [업로드 점검하기] 시 파일과 비교하여 호환성 검증.
     * <p>응답: { tableLabel, tableComment, keyField, columns: [{fieldName, dbColumnName, label, codeGrp, isKey, readOnly}, ...] }
     */
    public ExcelMetaInfo getMeta(String domainKey) {
        ExcelDomainHandler<?, ?, ?> handler = registry.get(domainKey);
        ExcelMetaInfo meta = handler.meta();
        if (meta == null) {
            meta = ExcelMetaBuilder.fromEntity(handler.entityClass(), handler.itemClass());
        }
        return meta;
    }
}
