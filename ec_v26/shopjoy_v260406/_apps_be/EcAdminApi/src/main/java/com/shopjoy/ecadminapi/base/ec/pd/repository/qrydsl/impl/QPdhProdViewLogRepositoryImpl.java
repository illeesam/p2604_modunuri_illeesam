package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
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
import org.springframework.util.StringUtils;

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
    private static final QSySite         sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pdhProdViewLog.regDate,
        "upd_date", pdhProdViewLog.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("device", pdhProdViewLog.device),
        Map.entry("ip", pdhProdViewLog.ip),
        Map.entry("logId", pdhProdViewLog.logId),
        Map.entry("memberId", pdhProdViewLog.memberId),
        Map.entry("prodId", pdhProdViewLog.prodId),
        Map.entry("refId", pdhProdViewLog.refId),
        Map.entry("refNm", pdhProdViewLog.refNm),
        Map.entry("referrer", pdhProdViewLog.referrer),
        Map.entry("searchKw", pdhProdViewLog.searchKw),
        Map.entry("sessionKey", pdhProdViewLog.sessionKey),
        Map.entry("siteId", pdhProdViewLog.siteId)
    );

    /* 상품 조회 로그 baseSelColumnQuery — 코드성 필드 없음 (로그성 원본값 저장) */
    private JPAQuery<PdhProdViewLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdViewLogDto.Item.class,
                        pdhProdViewLog.logId,        // 로그ID (PK, YYMMDDhhmmss+rand4)
                        pdhProdViewLog.siteId,        // 사이트ID
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
                .from(pdhProdViewLog)
                .leftJoin(sySite).on(sySite.siteId.eq(pdhProdViewLog.siteId));
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
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdhProdViewLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(pdhProdViewLog.siteId, search.getSiteId()),
                QdslUtil.strEq(pdhProdViewLog.logId, search.getLogId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        )
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
    public PdhProdViewLogDto.PageResponse selectPageData(PdhProdViewLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pdhProdViewLog.siteId, search.getSiteId()),
                QdslUtil.strEq(pdhProdViewLog.logId, search.getLogId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

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

        PdhProdViewLogDto.PageResponse res = new PdhProdViewLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(PdhProdViewLogDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PdhProdViewLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pdhProdViewLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdViewLog.logId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("logId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdhProdViewLog.logId));
                } else if ("refNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdhProdViewLog.refNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pdhProdViewLog.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pdhProdViewLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pdhProdViewLog.logId));
        }
        return orders;
    }

    /* 상품 조회 로그 수정 */
    @Override
    public int updateSelective(PdhProdViewLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdhProdViewLog);
        boolean hasAny = false;

        if (entity.getSiteId()     != null) { update.set(pdhProdViewLog.siteId,     entity.getSiteId());     hasAny = true; }
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
