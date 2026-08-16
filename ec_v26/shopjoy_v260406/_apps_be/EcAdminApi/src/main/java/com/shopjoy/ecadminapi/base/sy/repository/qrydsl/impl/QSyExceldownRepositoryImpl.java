package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyExceldownDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyExceldown;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyExceldown;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyExceldownRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** SyExceldown QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyExceldownRepositoryImpl implements QSyExceldownRepository {

    private final JPAQueryFactory queryFactory;
    private final EntityManager em;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyExceldownRepositoryImpl";
    private static final QSyExceldown syExceldown = QSyExceldown.syExceldown;
    private static final QSyUser syUser = QSyUser.syUser;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of(
        "reg_date", syExceldown.regDate,
        "upd_date", syExceldown.updDate,
        "start_date", syExceldown.startDate,
        "end_date", syExceldown.endDate
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * RUN_TYPE_CD         {SYNC: '즉시', ASYNC: '예약'}
     * EXCELDOWN_STATUS_CD {WAITING: '대기', RUNNING: '진행중', DONE: '완료', FAIL: '실패', TIMEOUT: '시간초과', CANCELED: '취소'}
     */
    private JPAQuery<SyExceldownDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyExceldownDto.Item.class,
                        syExceldown.exceldownId,        // 엑셀다운로드ID
                        syExceldown.domainCd,           // 엑셀 도메인 키
                        syExceldown.domainNm,           // 도메인 한글명
                        syExceldown.uiNm,               // 요청 화면명
                        syExceldown.apiUrl,             // 실행 backend API 경로
                        syExceldown.apiMethodCd,        // HTTP 메서드
                        syExceldown.runTypeCd,          // 실행유형 — RUN_TYPE_CD {SYNC, ASYNC}
                        syExceldown.exceldownStatusCd,  // 상태 — EXCELDOWN_STATUS_CD {WAITING, RUNNING, DONE, FAIL, TIMEOUT, CANCELED}
                        syExceldown.searchParamJson,    // 검색조건 스냅샷
                        syExceldown.totalCount,         // 대상 전체 건수
                        syExceldown.doneCount,          // 처리 완료 건수(진행률)
                        syExceldown.fileNm,             // 대표 파일명
                        syExceldown.fileSize,           // 대표 파일 크기
                        syExceldown.fileCount,          // 생성 파일 수
                        syExceldown.totalFileSize,      // 전체 파일 크기 합계
                        syExceldown.attachId,           // 대표 첨부파일ID
                        syExceldown.downloadCount,      // 다운로드 횟수
                        syExceldown.lastDownloadDate,   // 최종 다운로드일시
                        syExceldown.startDate,          // 실행 시작일시
                        syExceldown.endDate,            // 실행 종료일시
                        syExceldown.elapsedMs,          // 소요시간(ms)
                        syExceldown.errorMsg,           // 실패 사유
                        syExceldown.expireDate,         // 파일 보관 만료일시
                        syExceldown.podId,              // 실행 pod
                        syExceldown.cancelBy,           // 강제취소 실행자
                        syExceldown.cancelDate,         // 강제취소일시
                        syExceldown.regBy,              // 요청자
                        syExceldown.regDate,            // 요청일시
                        syExceldown.regSiteId,          // 등록사이트ID
                        syExceldown.updBy,              // 수정자
                        syExceldown.updDate,            // 수정일시(heartbeat)
                        syUser.userNm.as("regUserNm")   // 요청자명 (JOIN sy_user)
                ))
                .from(syExceldown)
                .leftJoin(syUser).on(syUser.userId.eq(syExceldown.regBy));
    }

    /* 엑셀다운로드 키조회 */
    @Override
    public Optional<SyExceldownDto.Item> selectById(String exceldownId) {
        SyExceldownDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syExceldown.exceldownId.eq(exceldownId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 엑셀다운로드 목록조회 */
    @Override
    public List<SyExceldownDto.Item> selectList(SyExceldownDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<SyExceldownDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(buildWhere(search))
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            query.offset((long) (pageNo - 1) * pageSize).limit(pageSize);
        }
        return query.fetch();
    }

    /* 엑셀다운로드 페이지조회 */
    @Override
    public BasePage<SyExceldownDto.Item> selectPageData(SyExceldownDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = buildWhere(search);

        JPAQuery<SyExceldownDto.Item> query = baseSelColumnQuery();

        List<SyExceldownDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(pageSize)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syExceldown.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyExceldownDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression[] buildWhere(SyExceldownDto.Request search) {
        return new BooleanExpression[] {
            QdslUtil.strEq(syExceldown.regSiteId, search.getSiteId()),
            QdslUtil.strEq(syExceldown.exceldownId, search.getExceldownId()),
            QdslUtil.strEq(syExceldown.domainCd, search.getDomainCd()),
            QdslUtil.strEq(syExceldown.runTypeCd, search.getRunTypeCd()),
            QdslUtil.strEq(syExceldown.exceldownStatusCd, search.getExceldownStatusCd()),
            QdslUtil.strEq(syExceldown.regBy, search.getRegBy()),
            QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
            andSearchValue(search.getSearchValue(), search.getSearchType())
        };
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("exceldownId", syExceldown.exceldownId),
            QdslUtil.FieldDef.like("domainCd", syExceldown.domainCd),
            QdslUtil.FieldDef.like("domainNm", syExceldown.domainNm),
            QdslUtil.FieldDef.like("uiNm", syExceldown.uiNm),
            QdslUtil.FieldDef.like("apiUrl", syExceldown.apiUrl),
            QdslUtil.FieldDef.like("fileNm", syExceldown.fileNm),
            QdslUtil.FieldDef.like("regBy", syExceldown.regBy)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "regDate desc, exceldownId asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("exceldownId", syExceldown.exceldownId,
                   "regDate", syExceldown.regDate,
                   "startDate", syExceldown.startDate,
                   "endDate", syExceldown.endDate,
                   "totalCount", syExceldown.totalCount,
                   "downloadCount", syExceldown.downloadCount),
        new OrderSpecifier<>(Order.DESC, syExceldown.regDate),
        new OrderSpecifier<>(Order.DESC, syExceldown.exceldownId));
    }

    /* 엑셀다운로드 수정 */
    @Override
    public int updateSelective(SyExceldown entity) {
        if (entity.getExceldownId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syExceldown);
        boolean hasAny = false;

        if (entity.getDomainCd()          != null) { update.set(syExceldown.domainCd,          entity.getDomainCd());          hasAny = true; }
        if (entity.getDomainNm()          != null) { update.set(syExceldown.domainNm,          entity.getDomainNm());          hasAny = true; }
        if (entity.getUiNm()              != null) { update.set(syExceldown.uiNm,              entity.getUiNm());              hasAny = true; }
        if (entity.getApiUrl()            != null) { update.set(syExceldown.apiUrl,            entity.getApiUrl());            hasAny = true; }
        if (entity.getApiMethodCd()       != null) { update.set(syExceldown.apiMethodCd,       entity.getApiMethodCd());       hasAny = true; }
        if (entity.getRunTypeCd()         != null) { update.set(syExceldown.runTypeCd,         entity.getRunTypeCd());         hasAny = true; }
        if (entity.getExceldownStatusCd() != null) { update.set(syExceldown.exceldownStatusCd, entity.getExceldownStatusCd()); hasAny = true; }
        if (entity.getSearchParamJson()   != null) { update.set(syExceldown.searchParamJson,   entity.getSearchParamJson());   hasAny = true; }
        if (entity.getTotalCount()        != null) { update.set(syExceldown.totalCount,        entity.getTotalCount());        hasAny = true; }
        if (entity.getDoneCount()         != null) { update.set(syExceldown.doneCount,         entity.getDoneCount());         hasAny = true; }
        if (entity.getFileNm()            != null) { update.set(syExceldown.fileNm,            entity.getFileNm());            hasAny = true; }
        if (entity.getFileSize()          != null) { update.set(syExceldown.fileSize,          entity.getFileSize());          hasAny = true; }
        if (entity.getFileCount()         != null) { update.set(syExceldown.fileCount,         entity.getFileCount());         hasAny = true; }
        if (entity.getTotalFileSize()     != null) { update.set(syExceldown.totalFileSize,     entity.getTotalFileSize());     hasAny = true; }
        if (entity.getAttachId()          != null) { update.set(syExceldown.attachId,          entity.getAttachId());          hasAny = true; }
        if (entity.getDownloadCount()     != null) { update.set(syExceldown.downloadCount,     entity.getDownloadCount());     hasAny = true; }
        if (entity.getLastDownloadDate()  != null) { update.set(syExceldown.lastDownloadDate,  entity.getLastDownloadDate());  hasAny = true; }
        if (entity.getStartDate()         != null) { update.set(syExceldown.startDate,         entity.getStartDate());         hasAny = true; }
        if (entity.getEndDate()           != null) { update.set(syExceldown.endDate,           entity.getEndDate());           hasAny = true; }
        if (entity.getElapsedMs()         != null) { update.set(syExceldown.elapsedMs,         entity.getElapsedMs());         hasAny = true; }
        if (entity.getErrorMsg()          != null) { update.set(syExceldown.errorMsg,          entity.getErrorMsg());          hasAny = true; }
        if (entity.getExpireDate()        != null) { update.set(syExceldown.expireDate,        entity.getExpireDate());        hasAny = true; }
        if (entity.getPodId()             != null) { update.set(syExceldown.podId,             entity.getPodId());             hasAny = true; }
        if (entity.getCancelBy()          != null) { update.set(syExceldown.cancelBy,          entity.getCancelBy());          hasAny = true; }
        if (entity.getCancelDate()        != null) { update.set(syExceldown.cancelDate,        entity.getCancelDate());        hasAny = true; }
        if (entity.getUpdBy()             != null) { update.set(syExceldown.updBy,             entity.getUpdBy());             hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 — heartbeat 기준 시각 */
        update.set(syExceldown.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syExceldown.exceldownId.eq(entity.getExceldownId())).execute();
        return (int) affected;
    }

    /* ── 큐/동시성 제어 ───────────────────────────────────────── */

    @Override
    public Optional<SyExceldownDto.Item> selectRunning(String siteId) {
        SyExceldownDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectRunning()")
                .where(syExceldown.exceldownStatusCd.eq("RUNNING"),
                       QdslUtil.strEq(syExceldown.regSiteId, siteId))
                .orderBy(new OrderSpecifier<>(Order.DESC, syExceldown.startDate))
                .limit(1)
                .fetchFirst();
        return Optional.ofNullable(dto);
    }

    @Override
    public long countWaiting(String siteId) {
        Long cnt = queryFactory
                .select(syExceldown.count())
                .from(syExceldown)
                .where(syExceldown.exceldownStatusCd.eq("WAITING"),
                       QdslUtil.strEq(syExceldown.regSiteId, siteId))
                .fetchOne();
        return CmUtil.nvlLong(cnt);
    }

    /**
     * 대기열 1건 claim — QueryDSL 은 FOR UPDATE SKIP LOCKED 를 표현할 수 없어 네이티브로 처리한다.
     *
     * <p>서브쿼리에서 WAITING 1건을 SKIP LOCKED 로 잠그고 그 행만 RUNNING 으로 바꾼다.
     * 다른 pod 가 이미 잠근 행은 건너뛰므로(SKIP LOCKED) 같은 건을 중복 실행하지 않는다.
     * 이미 RUNNING 이 있으면 부분 유니크 인덱스(uk01_running)에 걸려 UPDATE 가 실패하는데,
     * 이는 정상 동작이므로 호출 측에서 null 로 간주하고 다음 주기에 재시도한다.</p>
     */
    @Override
    public String claimNextWaiting(String siteId, String podId) {
        String sql = """
            UPDATE shopjoy_2604.sy_exceldown t
               SET exceldown_status_cd = 'RUNNING',
                   pod_id     = :podId,
                   start_date = now(),
                   upd_date   = now()
             WHERE t.exceldown_id = (
                   SELECT w.exceldown_id
                     FROM shopjoy_2604.sy_exceldown w
                    WHERE w.exceldown_status_cd = 'WAITING'
                      AND w.reg_site_id = :siteId
                    ORDER BY w.reg_date
                    FOR UPDATE SKIP LOCKED
                    LIMIT 1)
            RETURNING t.exceldown_id
            """;
        try {
            Query q = em.createNativeQuery(sql);
            q.setParameter("podId", podId);
            q.setParameter("siteId", siteId);
            List<?> rows = q.getResultList();
            return rows.isEmpty() ? null : String.valueOf(rows.get(0));
        } catch (Exception e) {
            /* uk01_running 위반 = 다른 pod 가 먼저 잡음. 정상 경합이므로 다음 주기에 재시도 */
            return null;
        }
    }

    /**
     * heartbeat 끊긴 RUNNING 회수 — upd_date 기준 무응답 판정.
     *
     * <p>start_date 기준이 아니라는 점이 핵심이다. 실행 중에는 청크마다 upd_date 가 갱신되므로
     * 20만건을 정상 처리하며 5분이 걸려도 회수되지 않고, pod 가 죽어 갱신이 멈춘 건만 잡힌다.</p>
     */
    @Override
    public int recoverStaleRunning(int timeoutMinutes) {
        String sql = """
            UPDATE shopjoy_2604.sy_exceldown
               SET exceldown_status_cd = 'TIMEOUT',
                   error_msg = COALESCE(error_msg, '')
                             || '실행 pod 응답 없음(' || :mins || '분 초과) — 자동 회수',
                   end_date  = now(),
                   upd_date  = now()
             WHERE exceldown_status_cd = 'RUNNING'
               AND COALESCE(upd_date, start_date) < now() - (:mins * INTERVAL '1 minute')
            """;
        Query q = em.createNativeQuery(sql);
        q.setParameter("mins", timeoutMinutes);
        return q.executeUpdate();
    }
}
