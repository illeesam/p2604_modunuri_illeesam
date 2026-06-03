package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmEvent QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmEventRepositoryImpl implements QPmEventRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmEventRepositoryImpl";
    private static final QPmEvent pmEvent = QPmEvent.pmEvent;

    /* 이벤트 baseSelColumnQuery */
    private JPAQuery<PmEventDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmEventDto.Item.class,
                        pmEvent.eventId, pmEvent.siteId, pmEvent.eventNm, pmEvent.eventTypeCd,
                        pmEvent.imgUrl, pmEvent.eventTitle, pmEvent.eventContent,
                        pmEvent.startDate, pmEvent.endDate, pmEvent.noticeStart, pmEvent.noticeEnd,
                        pmEvent.eventStatusCd, pmEvent.eventStatusCdBefore,
                        pmEvent.targetTypeCd, pmEvent.sortOrd, pmEvent.viewCnt,
                        pmEvent.useYn, pmEvent.eventDesc,
                        pmEvent.regBy, pmEvent.regDate, pmEvent.updBy, pmEvent.updDate
                ))
                .from(pmEvent);
    }

    /* 이벤트 키조회 */
    @Override
    public Optional<PmEventDto.Item> selectById(String eventId) {
        PmEventDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmEvent.eventId.eq(eventId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 이벤트 목록조회 */
    @Override
    public List<PmEventDto.Item> selectList(PmEventDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndEventId(search),
                    baseAndUseYn(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 이벤트 페이지조회 */
    @Override
    public PmEventDto.PageResponse selectPageData(PmEventDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndEventId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmEventDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmEventDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmEvent.count())
                .where(wheres)
                .fetchOne();

        PmEventDto.PageResponse res = new PmEventDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmEventDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmEvent.siteId.eq(search.getSiteId()) : null;
    }

    /* eventId 정확 일치 */
    private BooleanExpression baseAndEventId(PmEventDto.Request search) {
        return search != null && StringUtils.hasText(search.getEventId())
                ? pmEvent.eventId.eq(search.getEventId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(PmEventDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? pmEvent.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmEventDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pmEvent.regDate.goe(start).and(pmEvent.regDate.lt(endExcl));
            case "upd_date": return pmEvent.updDate.goe(start).and(pmEvent.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmEventDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",eventContent,", pmEvent.eventContent, pattern);
        or = orLike(or, all, types, ",eventDesc,", pmEvent.eventDesc, pattern);
        or = orLike(or, all, types, ",eventId,", pmEvent.eventId, pattern);
        or = orLike(or, all, types, ",eventNm,", pmEvent.eventNm, pattern);
        or = orLike(or, all, types, ",eventStatusCd,", pmEvent.eventStatusCd, pattern);
        or = orLike(or, all, types, ",eventStatusCdBefore,", pmEvent.eventStatusCdBefore, pattern);
        or = orLike(or, all, types, ",eventTitle,", pmEvent.eventTitle, pattern);
        or = orLike(or, all, types, ",eventTypeCd,", pmEvent.eventTypeCd, pattern);
        or = orLike(or, all, types, ",imgUrl,", pmEvent.imgUrl, pattern);
        or = orLike(or, all, types, ",siteId,", pmEvent.siteId, pattern);
        or = orLike(or, all, types, ",targetTypeCd,", pmEvent.targetTypeCd, pattern);
        or = orLike(or, all, types, ",useYn,", pmEvent.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmEventDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, pmEvent.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEvent.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEvent.eventId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("eventId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmEvent.eventId));
                } else if ("eventNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmEvent.eventNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmEvent.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, pmEvent.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, pmEvent.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEvent.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmEvent.eventId));
        }
        return orders;
    }

    /* 이벤트 수정 */


    @Override
    public int updateSelective(PmEvent entity) {
        if (entity.getEventId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmEvent);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(pmEvent.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getEventNm()             != null) { update.set(pmEvent.eventNm,             entity.getEventNm());             hasAny = true; }
        if (entity.getEventTypeCd()         != null) { update.set(pmEvent.eventTypeCd,         entity.getEventTypeCd());         hasAny = true; }
        if (entity.getImgUrl()              != null) { update.set(pmEvent.imgUrl,              entity.getImgUrl());              hasAny = true; }
        if (entity.getEventTitle()          != null) { update.set(pmEvent.eventTitle,          entity.getEventTitle());          hasAny = true; }
        if (entity.getEventContent()        != null) { update.set(pmEvent.eventContent,        entity.getEventContent());        hasAny = true; }
        if (entity.getStartDate()           != null) { update.set(pmEvent.startDate,           entity.getStartDate());           hasAny = true; }
        if (entity.getEndDate()             != null) { update.set(pmEvent.endDate,             entity.getEndDate());             hasAny = true; }
        if (entity.getNoticeStart()         != null) { update.set(pmEvent.noticeStart,         entity.getNoticeStart());         hasAny = true; }
        if (entity.getNoticeEnd()           != null) { update.set(pmEvent.noticeEnd,           entity.getNoticeEnd());           hasAny = true; }
        if (entity.getEventStatusCd()       != null) { update.set(pmEvent.eventStatusCd,       entity.getEventStatusCd());       hasAny = true; }
        if (entity.getEventStatusCdBefore() != null) { update.set(pmEvent.eventStatusCdBefore, entity.getEventStatusCdBefore()); hasAny = true; }
        if (entity.getTargetTypeCd()        != null) { update.set(pmEvent.targetTypeCd,        entity.getTargetTypeCd());        hasAny = true; }
        if (entity.getSortOrd()             != null) { update.set(pmEvent.sortOrd,             entity.getSortOrd());             hasAny = true; }
        if (entity.getViewCnt()             != null) { update.set(pmEvent.viewCnt,             entity.getViewCnt());             hasAny = true; }
        if (entity.getUseYn()               != null) { update.set(pmEvent.useYn,               entity.getUseYn());               hasAny = true; }
        if (entity.getEventDesc()           != null) { update.set(pmEvent.eventDesc,           entity.getEventDesc());           hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(pmEvent.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmEvent.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmEvent.eventId.eq(entity.getEventId())).execute();
        return (int) affected;
    }
}
