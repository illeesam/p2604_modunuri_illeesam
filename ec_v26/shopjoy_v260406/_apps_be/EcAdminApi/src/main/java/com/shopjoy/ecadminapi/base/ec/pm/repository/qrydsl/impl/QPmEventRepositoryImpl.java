package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
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
    private static final QPmEvent e = QPmEvent.pmEvent;

    /* 이벤트 키조회 */
    @Override
    public Optional<PmEventDto.Item> selectById(String eventId) {
        PmEventDto.Item dto = baseQuery()
                .where(e.eventId.eq(eventId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 이벤트 목록조회 */
    @Override
    public List<PmEventDto.Item> selectList(PmEventDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventDto.Item> query = baseQuery().where(where);
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

    /* 이벤트 페이지조회 */
    @Override
    public PmEventDto.PageResponse selectPageList(PmEventDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmEventDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmEventDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(e.count())
                .from(e)
                .where(where)
                .fetchOne();

        PmEventDto.PageResponse res = new PmEventDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 이벤트 baseQuery */
    private JPAQuery<PmEventDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmEventDto.Item.class,
                        e.eventId, e.siteId, e.eventNm, e.eventTypeCd,
                        e.imgUrl, e.eventTitle, e.eventContent,
                        e.startDate, e.endDate, e.noticeStart, e.noticeEnd,
                        e.eventStatusCd, e.eventStatusCdBefore,
                        e.targetTypeCd, e.sortOrd, e.viewCnt,
                        e.useYn, e.eventDesc,
                        e.regBy, e.regDate, e.updBy, e.updDate
                ))
                .from(e);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanBuilder buildCondition(PmEventDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))  w.and(e.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getEventId())) w.and(e.eventId.eq(s.getEventId()));
        if (StringUtils.hasText(s.getUseYn()))   w.and(e.useYn.eq(s.getUseYn()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",eventNm,"))    or.or(e.eventNm.likeIgnoreCase(pattern));
            if (all || types.contains(",eventTitle,")) or.or(e.eventTitle.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDate startDate = LocalDate.parse(s.getDateStart(), fmt);
            LocalDate endDate   = LocalDate.parse(s.getDateEnd(),   fmt);
            LocalDateTime start   = startDate.atStartOfDay();
            LocalDateTime endExcl = endDate.plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(e.regDate.goe(start)).and(e.regDate.lt(endExcl)); break;
                case "upd_date":
                    w.and(e.updDate.goe(start)).and(e.updDate.lt(endExcl)); break;
                default: break;
            }
        }
        return w;
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
            orders.add(new OrderSpecifier(Order.DESC, e.regDate));
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
                    orders.add(new OrderSpecifier(order, e.eventId));
                } else if ("eventNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, e.eventNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, e.regDate));
                }
            }
        }
        return orders;
    }

    /* 이벤트 수정 */
    @Override
    public int updateSelective(PmEvent entity) {
        if (entity.getEventId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(e);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(e.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getEventNm()             != null) { update.set(e.eventNm,             entity.getEventNm());             hasAny = true; }
        if (entity.getEventTypeCd()         != null) { update.set(e.eventTypeCd,         entity.getEventTypeCd());         hasAny = true; }
        if (entity.getImgUrl()              != null) { update.set(e.imgUrl,              entity.getImgUrl());              hasAny = true; }
        if (entity.getEventTitle()          != null) { update.set(e.eventTitle,          entity.getEventTitle());          hasAny = true; }
        if (entity.getEventContent()        != null) { update.set(e.eventContent,        entity.getEventContent());        hasAny = true; }
        if (entity.getStartDate()           != null) { update.set(e.startDate,           entity.getStartDate());           hasAny = true; }
        if (entity.getEndDate()             != null) { update.set(e.endDate,             entity.getEndDate());             hasAny = true; }
        if (entity.getNoticeStart()         != null) { update.set(e.noticeStart,         entity.getNoticeStart());         hasAny = true; }
        if (entity.getNoticeEnd()           != null) { update.set(e.noticeEnd,           entity.getNoticeEnd());           hasAny = true; }
        if (entity.getEventStatusCd()       != null) { update.set(e.eventStatusCd,       entity.getEventStatusCd());       hasAny = true; }
        if (entity.getEventStatusCdBefore() != null) { update.set(e.eventStatusCdBefore, entity.getEventStatusCdBefore()); hasAny = true; }
        if (entity.getTargetTypeCd()        != null) { update.set(e.targetTypeCd,        entity.getTargetTypeCd());        hasAny = true; }
        if (entity.getSortOrd()             != null) { update.set(e.sortOrd,             entity.getSortOrd());             hasAny = true; }
        if (entity.getViewCnt()             != null) { update.set(e.viewCnt,             entity.getViewCnt());             hasAny = true; }
        if (entity.getUseYn()               != null) { update.set(e.useYn,               entity.getUseYn());               hasAny = true; }
        if (entity.getEventDesc()           != null) { update.set(e.eventDesc,           entity.getEventDesc());           hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(e.updBy,               entity.getUpdBy());               hasAny = true; }
        if (entity.getUpdDate()             != null) { update.set(e.updDate,             entity.getUpdDate());             hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(e.eventId.eq(entity.getEventId())).execute();
        return (int) affected;
    }
}
