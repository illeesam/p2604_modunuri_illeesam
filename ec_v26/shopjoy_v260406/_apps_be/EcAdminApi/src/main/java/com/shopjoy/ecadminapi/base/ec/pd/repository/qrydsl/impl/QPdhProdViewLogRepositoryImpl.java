package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** PdhProdViewLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdhProdViewLogRepositoryImpl implements QPdhProdViewLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdViewLogRepositoryImpl";
    private static final QPdhProdViewLog pdhProdViewLog   = QPdhProdViewLog.pdhProdViewLog;
    private static final QSySite         sySite = QSySite.sySite;

    /* 상품 조회 로그 baseSelColumnQuery */
    private JPAQuery<PdhProdViewLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdViewLogDto.Item.class,
                        pdhProdViewLog.logId,
                        pdhProdViewLog.siteId,
                        pdhProdViewLog.memberId,
                        pdhProdViewLog.sessionKey,
                        pdhProdViewLog.prodId,
                        pdhProdViewLog.refId,
                        pdhProdViewLog.refNm,
                        pdhProdViewLog.searchKw,
                        pdhProdViewLog.ip,
                        pdhProdViewLog.device,
                        pdhProdViewLog.referrer,
                        pdhProdViewLog.viewDate,
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
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 상품 조회 로그 페이지조회 */
    @Override
    public PdhProdViewLogDto.PageResponse selectPageData(PdhProdViewLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PdhProdViewLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdhProdViewLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(pdhProdViewLog.count())
                .from(pdhProdViewLog)
                .where(wheres)
                .fetchOne();

        PdhProdViewLogDto.PageResponse res = new PdhProdViewLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdhProdViewLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pdhProdViewLog.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression baseAndLogId(PdhProdViewLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? pdhProdViewLog.logId.eq(search.getLogId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdhProdViewLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pdhProdViewLog.regDate.goe(start).and(pdhProdViewLog.regDate.lt(endExcl));
            case "upd_date": return pdhProdViewLog.updDate.goe(start).and(pdhProdViewLog.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PdhProdViewLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",device,", pdhProdViewLog.device, pattern);
        or = orLike(or, all, types, ",ip,", pdhProdViewLog.ip, pattern);
        or = orLike(or, all, types, ",logId,", pdhProdViewLog.logId, pattern);
        or = orLike(or, all, types, ",memberId,", pdhProdViewLog.memberId, pattern);
        or = orLike(or, all, types, ",prodId,", pdhProdViewLog.prodId, pattern);
        or = orLike(or, all, types, ",refId,", pdhProdViewLog.refId, pattern);
        or = orLike(or, all, types, ",refNm,", pdhProdViewLog.refNm, pattern);
        or = orLike(or, all, types, ",referrer,", pdhProdViewLog.referrer, pattern);
        or = orLike(or, all, types, ",searchKw,", pdhProdViewLog.searchKw, pattern);
        or = orLike(or, all, types, ",sessionKey,", pdhProdViewLog.sessionKey, pattern);
        or = orLike(or, all, types, ",siteId,", pdhProdViewLog.siteId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
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
