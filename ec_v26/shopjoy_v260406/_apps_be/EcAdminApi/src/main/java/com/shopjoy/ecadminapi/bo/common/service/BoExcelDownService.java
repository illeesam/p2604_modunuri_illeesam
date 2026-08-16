package com.shopjoy.ecadminapi.bo.common.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.AttachFile;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyExceldownDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyExceldown;
import com.shopjoy.ecadminapi.base.sy.service.SyAttachService;
import com.shopjoy.ecadminapi.base.sy.service.SyExceldownService;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainRegistry;
import com.shopjoy.ecadminapi.common.excel.ExcelDownProps;
import com.shopjoy.ecadminapi.common.excel.ExcelExportUtil;
import com.shopjoy.ecadminapi.common.excel.ExcelMetaBuilder;
import com.shopjoy.ecadminapi.common.excel.ExcelMetaInfo;
import com.shopjoy.ecadminapi.common.excel.GridColumnMetaBuilder;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * BO 엑셀 다운로드 오케스트레이터 — 상태 조회 / 즉시 실행 / 예약 접수 / 취소.
 *
 * <p>동시 1건 정책은 DB(부분 유니크 인덱스)가 강제한다. 이 서비스는 그 결과를
 * 사용자에게 읽히는 메시지로 바꿔주는 역할까지 맡는다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BoExcelDownService {

    private final ExcelDomainRegistry registry;
    private final ExcelDownProps props;
    private final SyExceldownService syExceldownService;
    private final SyAttachService syAttachService;
    private final ObjectMapper objectMapper;

    private static final String REF_TABLE = "sy_exceldown";

    /* ── 상태 조회 ───────────────────────────────────────────── */

    /**
     * [엑셀] 클릭 시 화면이 필요한 모든 정보를 한 번에 준다.
     * 진행중 건이 있으면 그 상세까지 담아 "무엇이 돌고 있는지" 를 보여줄 수 있게 한다.
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public SyExceldownDto.Status getStatus(String domainKey, Map<String, Object> queryParams) {
        String siteId = SecurityUtil.getSiteIdOrDefault();

        SyExceldownDto.Status st = new SyExceldownDto.Status();
        SyExceldownDto.Item running = syExceldownService.getRunning(siteId);
        st.setRunning(running);
        st.setAvailable(running == null);
        st.setWaitingCount((int) syExceldownService.countWaiting(siteId));
        st.setSyncMaxRows(props.syncMaxRows());
        st.setSplitRows(props.splitRows());

        long total = 0;
        if (domainKey != null && !domainKey.isBlank()) {
            ExcelDomainHandler handler = registry.get(domainKey);
            BaseRequest req = (BaseRequest) objectMapper.convertValue(queryParams, handler.reqClass());
            total = handler.countList(req);
        }
        st.setTargetCount(total);
        st.setSyncAllowed(running == null && total > 0 && total <= props.syncMaxRows());
        return st;
    }

    /* ── 즉시(SYNC) ──────────────────────────────────────────── */

    /**
     * 즉시 다운로드 — 요청 스레드가 그대로 xlsx 를 스트리밍한다.
     *
     * <p>이력은 남기되 파일은 저장하지 않는다(브라우저로 바로 흘려보냄).
     * 상한을 넘거나 이미 진행중이면 시작 전에 막는다.</p>
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public void exportSync(String domainKey, Map<String, Object> queryParams,
                           String uiNm, HttpServletResponse response) {
        ExcelDomainHandler handler = registry.get(domainKey);
        BaseRequest req = (BaseRequest) objectMapper.convertValue(queryParams, handler.reqClass());

        long total = handler.countList(req);
        int syncMax = props.syncMaxRows();
        if (total > syncMax) {
            throw new CmBizException(String.format(
                "즉시 다운로드는 %,d건까지 가능합니다. 현재 %,d건 — 예약다운로드를 이용해주세요.", syncMax, total));
        }

        SyExceldown job = startJob(domainKey, handler, queryParams, uiNm, "SYNC",
                                   "/api/bo/excel/" + domainKey + "/excel", (int) total);
        LocalDateTime start = job.getStartDate();
        try {
            ExcelMetaInfo meta = resolveMeta(handler, queryParams);

            final int[] cnt = { 0 };
            ExcelExportUtil.writeXlsxWithMeta(response, meta, handler.itemClass(),
                rowWriter -> handler.fetchChunked(req, props.chunkRows(), item -> { cnt[0]++; rowWriter.accept(item); })
            );
            syExceldownService.finishDone(job.getExceldownId(), cnt[0], null, null, 0, 0L, null, start, null);
        } catch (Exception e) {
            syExceldownService.finishFail(job.getExceldownId(), e.getMessage(), start);
            throw e;
        }
    }

    /* ── 예약(ASYNC) ─────────────────────────────────────────── */

    /**
     * 예약 접수 — WAITING 으로 넣고 즉시 반환한다. 실제 생성은 스케줄러가 집어간다.
     *
     * <p>진행중이어도 접수는 받는다 — 대기열에 쌓였다가 순서대로 실행된다.
     * 이게 @Async 즉시실행 대비 큰 장점이다(사용자가 다시 시도할 필요 없음).</p>
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public SyExceldownDto.Item requestAsync(String domainKey, Map<String, Object> queryParams, String uiNm) {
        ExcelDomainHandler handler = registry.get(domainKey);
        BaseRequest req = (BaseRequest) objectMapper.convertValue(queryParams, handler.reqClass());

        long total = handler.countList(req);
        if (total <= 0) throw new CmBizException("다운로드할 데이터가 없습니다. 검색조건을 확인해주세요.");
        if (total > ExcelExportUtil.MAX_ROW_HARD_LIMIT) {
            throw new CmBizException(String.format(
                "한 번에 받을 수 있는 상한(%,d건)을 초과했습니다. 현재 %,d건 — 기간을 나눠 요청해주세요.",
                ExcelExportUtil.MAX_ROW_HARD_LIMIT, total));
        }
        SyExceldown job = startJob(domainKey, handler, queryParams, uiNm, "ASYNC",
                                   "/api/bo/excel/" + domainKey + "/excel", (int) total);
        return syExceldownService.getById(job.getExceldownId());
    }

    /* ── 취소 ────────────────────────────────────────────────── */

    /** 강제취소 — 진행중/대기중 건을 해제해 슬롯을 푼다 */
    @Transactional
    public void cancel(String exceldownId) {
        syExceldownService.cancel(exceldownId);
    }

    /* ── 목록/상세 ───────────────────────────────────────────── */

    public BasePage<SyExceldownDto.Item> getPageData(SyExceldownDto.Request req) {
        return syExceldownService.getPageData(req);
    }

    /** 상세 — 생성된 파일 목록(sy_attach ref)까지 채워서 반환 */
    public SyExceldownDto.Item getById(String id) {
        SyExceldownDto.Item item = syExceldownService.getById(id);
        item.setAttachFiles(syAttachService.getAttachFilesByRef(REF_TABLE, id));
        return item;
    }

    /** 다운로드 카운트 +1 (파일 실제 전송은 /cdn 정적 서빙 또는 첨부 다운로드 API 가 담당) */
    public void markDownloaded(String id) {
        syExceldownService.increaseDownloadCount(id);
    }

    /* ── 내부 ────────────────────────────────────────────────── */

    /**
     * 엑셀 메타 결정 — <b>화면 그리드 헤더가 최우선</b>.
     *
     * <p>Entity 기반 메타를 쓰면 화면에서 보던 컬럼과 구성·순서·라벨이 달라져
     * 사용자에겐 "그리드와 다른 파일"이 된다. 그래서 프론트가 보낸 {@code excelColumns}
     * (그리드 헤더)를 먼저 쓰고, 없거나 못 쓸 때만 기존 방식으로 되돌아간다.</p>
     */
    private ExcelMetaInfo resolveMeta(ExcelDomainHandler<?, ?, ?> handler, Map<String, Object> queryParams) {
        Object raw = queryParams == null ? null : queryParams.get(GridColumnMetaBuilder.PARAM);
        ExcelMetaInfo grid = GridColumnMetaBuilder.fromGridJson(
            raw == null ? null : String.valueOf(raw), handler.itemClass(), handler.label(), objectMapper);
        if (grid != null) return grid;

        ExcelMetaInfo meta = handler.meta();
        return meta != null ? meta : ExcelMetaBuilder.fromEntity(handler.entityClass(), handler.itemClass());
    }

    /**
     * 요청 행 생성 — SYNC 는 RUNNING, ASYNC 는 WAITING.
     *
     * <p>SYNC 인데 이미 RUNNING 이 있으면 부분 유니크 인덱스가 INSERT 를 거부한다.
     * 그 예외를 사용자 문장으로 바꿔 "무엇이 돌고 있는지" 를 알려준다.</p>
     */
    private SyExceldown startJob(String domainKey, ExcelDomainHandler<?, ?, ?> handler,
                                 Map<String, Object> queryParams, String uiNm,
                                 String runTypeCd, String apiUrl, int total) {
        String json;
        try {
            json = objectMapper.writeValueAsString(queryParams == null ? Map.of() : queryParams);
        } catch (Exception e) {
            json = null;
        }
        SyExceldown body = SyExceldown.builder()
            .domainCd(domainKey)
            .domainNm(handler.label())
            .uiNm(uiNm)
            .apiUrl(apiUrl)
            .apiMethodCd("GET")
            .runTypeCd(runTypeCd)
            .searchParamJson(json)
            .totalCount(total)
            .build();
        try {
            return syExceldownService.create(body);
        } catch (Exception e) {
            if (isRunningConflict(e)) {
                throw new CmBizException(buildBusyMessage());
            }
            throw e;
        }
    }

    /** uk01_running 위반인지 판별 — 메시지에 인덱스명이 실린다 */
    private boolean isRunningConflict(Throwable e) {
        for (Throwable t = e; t != null; t = t.getCause()) {
            String m = t.getMessage();
            if (m != null && m.contains("sy_exceldown_uk01_running")) return true;
        }
        return false;
    }

    /** 진행중 건 정보를 담은 안내문 — 화면은 여기에 [강제취소] 버튼을 붙인다 */
    private String buildBusyMessage() {
        SyExceldownDto.Item r = syExceldownService.getRunning(SecurityUtil.getSiteIdOrDefault());
        if (r == null) return "다른 엑셀 다운로드가 진행 중입니다. 잠시 후 다시 시도해주세요.";
        String who = (r.getRegUserNm() != null && !r.getRegUserNm().isBlank()) ? r.getRegUserNm() : r.getRegBy();
        return String.format("이미 진행 중인 엑셀 다운로드가 있습니다. [%s] %s 요청 (%,d건, 시작 %s)",
            r.getDomainNm() != null ? r.getDomainNm() : r.getDomainCd(),
            who,
            r.getTotalCount() == null ? 0 : r.getTotalCount(),
            r.getStartDate() == null ? "-" : r.getStartDate().toString().replace('T', ' '));
    }
}
