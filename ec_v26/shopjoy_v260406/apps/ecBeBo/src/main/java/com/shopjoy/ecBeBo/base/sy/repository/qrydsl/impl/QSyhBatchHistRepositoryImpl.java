package com.shopjoy.ecBeBo.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhBatchHistDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyhBatchHist;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyhBatchHist;
import com.shopjoy.ecBeBo.base.sy.repository.qrydsl.QSyhBatchHistRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
/** SyhBatchHist(배치 실행 이력) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhBatchHistRepositoryImpl implements QSyhBatchHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhBatchHistRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QSyhBatchHist syhBatchHist   = QSyhBatchHist.syhBatchHist;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (sy_code 미등록, Entity 주석 기준 예시값)
     * runStatusCd  {SUCCESS: '성공', FAILED: '실패', TIMEOUT: '시간초과'}
     */
    /* 배치 실행 이력 baseSelColumnQuery */
    private JPAQuery<SyhBatchHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhBatchHistDto.Item.class,
                        syhBatchHist.batchHistId,   // 이력ID (PK)
                        syhBatchHist.batchId,       // 배치ID
                        syhBatchHist.batchCode,     // 배치코드
                        syhBatchHist.batchNm,       // 배치명
                        syhBatchHist.runAt,         // 실행시작일시
                        syhBatchHist.endAt,         // 실행종료일시
                        syhBatchHist.durationMs,    // 실행시간(ms)
                        syhBatchHist.runStatusCd,     // 실행결과 — {SUCCESS: '성공', FAILED: '실패', TIMEOUT: '시간초과'}
                        syhBatchHist.procCount,     // 처리건수
                        syhBatchHist.errorCount,    // 오류건수
                        syhBatchHist.message,       // 결과메시지
                        syhBatchHist.detail,        // 상세로그 (JSON)
                        syhBatchHist.regBy,         // 등록자
                        syhBatchHist.regDate,       // 등록일시
                        syhBatchHist.updBy,         // 수정자
                        syhBatchHist.updDate,       // 수정일시
                        syhBatchHist.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(syhBatchHist)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(syhBatchHist.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(syhBatchHist.regBy)) // 등록자
                ;
    }

    /* 배치 실행 이력 키조회 */
    @Override
    public Optional<SyhBatchHistDto.Item> selectById(String id) {
        SyhBatchHistDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhBatchHist.batchHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 배치 실행 이력 목록조회 */
    @Override
    public List<SyhBatchHistDto.Item> selectList(SyhBatchHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhBatchHist.batchHistId, search.getBatchHistId())); // 이력ID
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhBatchHist.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhBatchHist.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyhBatchHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyhBatchHistDto.Item> list = query.fetch();
        return list;
    }

    /* 배치 실행 이력 페이지조회 */
    @Override
    public BasePage<SyhBatchHistDto.Item> selectPageData(SyhBatchHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhBatchHist.batchHistId, search.getBatchHistId())); // 이력ID
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhBatchHist.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhBatchHist.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyhBatchHistDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyhBatchHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhBatchHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyhBatchHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "batchCode,batchHistId,batchId,batchNm,detail" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("batchCode", syhBatchHist.batchCode), // 배치코드
            QdslUtil.FieldDef.like("batchHistId", syhBatchHist.batchHistId), // 이력ID
            QdslUtil.FieldDef.like("batchId", syhBatchHist.batchId), // 배치ID
            QdslUtil.FieldDef.like("batchNm", syhBatchHist.batchNm), // 배치명
            QdslUtil.FieldDef.like("detail", syhBatchHist.detail), // 상세로그 (JSON)
            QdslUtil.FieldDef.like("message", syhBatchHist.message), // 결과메시지
            QdslUtil.FieldDef.like("runStatusCd", syhBatchHist.runStatusCd) // 실행결과 (코드: BATCH_STATUS — SUCCESS/FAILED/TIMEOUT)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("batchHistId", syhBatchHist.batchHistId,
                   "batchNm", syhBatchHist.batchNm,
                   "regDate", syhBatchHist.regDate),
        new OrderSpecifier<>(Order.DESC, syhBatchHist.regDate),
        new OrderSpecifier<>(Order.ASC, syhBatchHist.batchHistId));
    }

    /* 배치 실행 이력 수정 */
    @Override
    public int updateSelective(SyhBatchHist entity) {
        if (entity.getBatchHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhBatchHist);
        boolean hasAny = false;

        if (entity.getBatchId()    != null) { update.set(syhBatchHist.batchId,    entity.getBatchId());    hasAny = true; }
        if (entity.getBatchCode()  != null) { update.set(syhBatchHist.batchCode,  entity.getBatchCode());  hasAny = true; }
        if (entity.getBatchNm()    != null) { update.set(syhBatchHist.batchNm,    entity.getBatchNm());    hasAny = true; }
        if (entity.getRunAt()      != null) { update.set(syhBatchHist.runAt,      entity.getRunAt());      hasAny = true; }
        if (entity.getEndAt()      != null) { update.set(syhBatchHist.endAt,      entity.getEndAt());      hasAny = true; }
        if (entity.getDurationMs() != null) { update.set(syhBatchHist.durationMs, entity.getDurationMs()); hasAny = true; }
        if (entity.getRunStatusCd()  != null) { update.set(syhBatchHist.runStatusCd,  entity.getRunStatusCd());  hasAny = true; }
        if (entity.getProcCount()  != null) { update.set(syhBatchHist.procCount,  entity.getProcCount());  hasAny = true; }
        if (entity.getErrorCount() != null) { update.set(syhBatchHist.errorCount, entity.getErrorCount()); hasAny = true; }
        if (entity.getMessage()    != null) { update.set(syhBatchHist.message,    entity.getMessage());    hasAny = true; }
        if (entity.getDetail()     != null) { update.set(syhBatchHist.detail,     entity.getDetail());     hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(syhBatchHist.updBy,      entity.getUpdBy());      hasAny = true; }
        update.set(syhBatchHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhBatchHist.batchHistId.eq(entity.getBatchHistId())).execute();
        return (int) affected;
    }
}
