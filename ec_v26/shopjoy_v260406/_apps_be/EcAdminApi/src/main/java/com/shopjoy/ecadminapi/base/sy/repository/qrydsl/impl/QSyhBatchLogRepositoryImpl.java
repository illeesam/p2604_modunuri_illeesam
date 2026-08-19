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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhBatchLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhBatchLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhBatchLogRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyhBatchLog(배치 실행 로그) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhBatchLogRepositoryImpl implements QSyhBatchLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhBatchLogRepositoryImpl";
    private static final QSyhBatchLog syhBatchLog   = QSyhBatchLog.syhBatchLog;
    private static final QSySite      sySite = QSySite.sySite;
    private static final QVwSyCode      cd_bs  = new QVwSyCode("cd_bs");    /*
     * baseSelColumnQuery — list/page/byId 공유 (코드명 조인 포함 풀필드)
     * 코드성 필드 예시 코드값
     * BATCH_STATUS  {PENDING: '대기', RUNNING: '실행중', DONE: '완료', FAILED: '실패'}
     */
    private JPAQuery<SyhBatchLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhBatchLogDto.Item.class,
                        syhBatchLog.batchLogId,   // 로그ID (PK, YYMMDDhhmmss+rand4)
                        syhBatchLog.batchId,      // 배치ID
                        syhBatchLog.batchCode,    // 배치코드
                        syhBatchLog.batchNm,      // 배치명
                        syhBatchLog.runAt,        // 실행시작일시
                        syhBatchLog.endAt,        // 실행종료일시
                        syhBatchLog.durationMs,   // 실행시간(ms)
                        syhBatchLog.runStatusCd,    // 실행결과 — BATCH_STATUS {PENDING: '대기', RUNNING: '실행중', DONE: '완료', FAILED: '실패'}
                        syhBatchLog.procCount,    // 처리건수
                        syhBatchLog.errorCount,   // 오류건수
                        syhBatchLog.message,      // 결과메시지
                        syhBatchLog.detail,       // 상세로그 (JSON)
                        syhBatchLog.regBy,        // 등록자
                        syhBatchLog.regDate,      // 등록일시
                        syhBatchLog.updBy,        // 수정자
                        syhBatchLog.updDate,      // 수정일시
                        cd_bs.codeLabel.as("runStatusCdNm")  // 실행결과 코드명 (조인: sy_code BATCH_STATUS)
                ))
                .from(syhBatchLog)
                .leftJoin(cd_bs).on(cd_bs.codeGrp.eq("BATCH_STATUS").and(cd_bs.codeValue.eq(syhBatchLog.runStatusCd))) // 배치상태
                ;
    }

    /* 배치 로그 키조회 (단건 상세 — baseSelColumnQuery 공유) */
    @Override
    public Optional<SyhBatchLogDto.Item> selectById(String id) {
        SyhBatchLogDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhBatchLog.batchLogId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 배치 로그 목록조회 */
    @Override
    public List<SyhBatchLogDto.Item> selectList(SyhBatchLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhBatchLog.batchLogId, search.getBatchLogId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhBatchLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhBatchLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyhBatchLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyhBatchLogDto.Item> list = query.fetch();
        return list;
    }

    /* 배치 로그 페이지조회 */
    @Override
    public BasePage<SyhBatchLogDto.Item> selectPageData(SyhBatchLogDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhBatchLog.batchLogId, search.getBatchLogId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhBatchLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhBatchLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyhBatchLogDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyhBatchLogDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhBatchLog.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyhBatchLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("batchCode", syhBatchLog.batchCode),
            QdslUtil.FieldDef.like("batchId", syhBatchLog.batchId),
            QdslUtil.FieldDef.like("batchLogId", syhBatchLog.batchLogId),
            QdslUtil.FieldDef.like("batchNm", syhBatchLog.batchNm),
            QdslUtil.FieldDef.like("detail", syhBatchLog.detail),
            QdslUtil.FieldDef.like("message", syhBatchLog.message),
            QdslUtil.FieldDef.like("runStatusCd", syhBatchLog.runStatusCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("batchLogId", syhBatchLog.batchLogId,
                   "batchNm", syhBatchLog.batchNm,
                   "regDate", syhBatchLog.regDate),
        new OrderSpecifier<>(Order.DESC, syhBatchLog.regDate),
        new OrderSpecifier<>(Order.ASC, syhBatchLog.batchLogId));
    }

    /* 배치 로그 수정 */
    @Override
    public int updateSelective(SyhBatchLog entity) {
        if (entity.getBatchLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhBatchLog);
        boolean hasAny = false;

        if (entity.getBatchId()    != null) { update.set(syhBatchLog.batchId,    entity.getBatchId());    hasAny = true; }
        if (entity.getBatchCode()  != null) { update.set(syhBatchLog.batchCode,  entity.getBatchCode());  hasAny = true; }
        if (entity.getBatchNm()    != null) { update.set(syhBatchLog.batchNm,    entity.getBatchNm());    hasAny = true; }
        if (entity.getRunAt()      != null) { update.set(syhBatchLog.runAt,      entity.getRunAt());      hasAny = true; }
        if (entity.getEndAt()      != null) { update.set(syhBatchLog.endAt,      entity.getEndAt());      hasAny = true; }
        if (entity.getDurationMs() != null) { update.set(syhBatchLog.durationMs, entity.getDurationMs()); hasAny = true; }
        if (entity.getRunStatusCd()  != null) { update.set(syhBatchLog.runStatusCd,  entity.getRunStatusCd());  hasAny = true; }
        if (entity.getProcCount()  != null) { update.set(syhBatchLog.procCount,  entity.getProcCount());  hasAny = true; }
        if (entity.getErrorCount() != null) { update.set(syhBatchLog.errorCount, entity.getErrorCount()); hasAny = true; }
        if (entity.getMessage()    != null) { update.set(syhBatchLog.message,    entity.getMessage());    hasAny = true; }
        if (entity.getDetail()     != null) { update.set(syhBatchLog.detail,     entity.getDetail());     hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(syhBatchLog.updBy,      entity.getUpdBy());      hasAny = true; }
        update.set(syhBatchLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhBatchLog.batchLogId.eq(entity.getBatchLogId())).execute();
        return (int) affected;
    }
}
