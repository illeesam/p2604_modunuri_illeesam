package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdViewLogDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdViewLog;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdViewLog;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdViewLogRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** PdhProdViewLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdhProdViewLogRepositoryImpl implements QPdhProdViewLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdViewLogRepositoryImpl";
    private static final QPdhProdViewLog pdhProdViewLog   = QPdhProdViewLog.pdhProdViewLog;
    private static final QSySite         sySite = QSySite.sySite;    /* 상품 조회 로그 baseSelColumnQuery — 코드성 필드 없음 (로그성 원본값 저장) */
    private JPAQuery<PdhProdViewLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdViewLogDto.Item.class,
                        pdhProdViewLog.logId,        // 로그ID (PK, YYMMDDhhmmss+rand4)
                        pdhProdViewLog.memberId,      // 회원ID (비회원 NULL)
                        pdhProdViewLog.sessionKey,    // 비회원 세션키
                        pdhProdViewLog.prodId,        // 상품ID (pd_prod.prod_id)
                        pdhProdViewLog.refId,         // 참조ID (prod_id 등)
                        pdhProdViewLog.refNm,         // 참조명 스냅샷
                        pdhProdViewLog.searchKw,      // 검색어 (SEARCH 유형)
                        pdhProdViewLog.ip,            // IP주소
                        pdhProdViewLog.device,        // User-Agent
                        pdhProdViewLog.referrer,      // 유입경로 URL
                        pdhProdViewLog.viewDate,      // 조회일시
                        pdhProdViewLog.regBy, pdhProdViewLog.regDate, pdhProdViewLog.updBy, pdhProdViewLog.updDate
                ))
                .from(pdhProdViewLog);
    }

    /* 상품 조회 로그 키조회 */
    @Override
    public Optional<PdhProdViewLogDto.Item> selectById(String id) {
        PdhProdViewLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(pdhProdViewLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 조회 로그 목록조회 */
    @Override
    public List<PdhProdViewLogDto.Item> selectList(PdhProdViewLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> wheres = new ArrayList<>();
        wheres.add(QdslUtil.strEq(pdhProdViewLog.logId, search.getLogId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            wheres.add(QdslUtil.dateBetween(pdhProdViewLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else {
            wheres.add(QdslUtil.dateBetween(pdhProdViewLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));   // reg_date (기본)
        }
        wheres.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<PdhProdViewLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres.toArray(BooleanExpression[]::new))
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 상품 조회 로그 페이지조회 */
    @Override
    public BasePage<PdhProdViewLogDto.Item> selectPageData(PdhProdViewLogDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        /* 검색조건 — 배열 초기화 { } 대신 리스트에 하나씩 add 한다.
           .where(a, b, c) 인자 자리나 배열 초기화 { } 안에는 식(expression)만 올 수 있어
           if 를 쓸 수 없지만, 리스트에 담으면 분기 조건을 if 로 그대로 풀어 쓸 수 있다.
           null 을 add 해도 QueryDSL where 가 무시하므로 기존 "조건 없으면 null" 관례 그대로 유효. */
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdhProdViewLog.logId, search.getLogId()));
        /* 기간검색 — dateRangeType 값에 따라 대상 컬럼을 직접 지정 */
        if ("upd_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pdhProdViewLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        } else if ("reg_date".equals(search.getDateRangeType())) {
            whereList.add(QdslUtil.dateBetween(pdhProdViewLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()));
        }
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PdhProdViewLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PdhProdViewLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdhProdViewLog.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdhProdViewLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("device", pdhProdViewLog.device),
            QdslUtil.FieldDef.like("ip", pdhProdViewLog.ip),
            QdslUtil.FieldDef.like("logId", pdhProdViewLog.logId),
            QdslUtil.FieldDef.like("memberId", pdhProdViewLog.memberId),
            QdslUtil.FieldDef.like("prodId", pdhProdViewLog.prodId),
            QdslUtil.FieldDef.like("refId", pdhProdViewLog.refId),
            QdslUtil.FieldDef.like("refNm", pdhProdViewLog.refNm),
            QdslUtil.FieldDef.like("referrer", pdhProdViewLog.referrer),
            QdslUtil.FieldDef.like("searchKw", pdhProdViewLog.searchKw),
            QdslUtil.FieldDef.like("sessionKey", pdhProdViewLog.sessionKey)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("logId", pdhProdViewLog.logId,
                   "refNm", pdhProdViewLog.refNm,
                   "regDate", pdhProdViewLog.regDate),
        new OrderSpecifier<>(Order.DESC, pdhProdViewLog.regDate),
        new OrderSpecifier<>(Order.ASC, pdhProdViewLog.logId));
    }

    /* 상품 조회 로그 수정 */
    @Override
    public int updateSelective(PdhProdViewLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdhProdViewLog);
        boolean hasAny = false;

        if (entity.getMemberId()   != null) { update.set(pdhProdViewLog.memberId,   entity.getMemberId());   hasAny = true; }
        if (entity.getSessionKey() != null) { update.set(pdhProdViewLog.sessionKey, entity.getSessionKey()); hasAny = true; }
        if (entity.getProdId()     != null) { update.set(pdhProdViewLog.prodId,     entity.getProdId());     hasAny = true; }
        if (entity.getRefId()      != null) { update.set(pdhProdViewLog.refId,      entity.getRefId());      hasAny = true; }
        if (entity.getRefNm()      != null) { update.set(pdhProdViewLog.refNm,      entity.getRefNm());      hasAny = true; }
        if (entity.getSearchKw()   != null) { update.set(pdhProdViewLog.searchKw,   entity.getSearchKw());   hasAny = true; }
        if (entity.getIp()         != null) { update.set(pdhProdViewLog.ip,         entity.getIp());         hasAny = true; }
        if (entity.getDevice()     != null) { update.set(pdhProdViewLog.device,     entity.getDevice());     hasAny = true; }
        if (entity.getReferrer()   != null) { update.set(pdhProdViewLog.referrer,   entity.getReferrer());   hasAny = true; }
        if (entity.getViewDate()   != null) { update.set(pdhProdViewLog.viewDate,   entity.getViewDate());   hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(pdhProdViewLog.updBy,      entity.getUpdBy());      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pdhProdViewLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdhProdViewLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
