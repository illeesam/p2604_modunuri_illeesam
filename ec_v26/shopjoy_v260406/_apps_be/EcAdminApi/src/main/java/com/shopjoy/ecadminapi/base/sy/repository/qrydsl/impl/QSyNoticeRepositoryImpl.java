package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyNotice;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyNoticeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyNotice QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyNoticeRepositoryImpl implements QSyNoticeRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyNotice n = QSyNotice.syNotice;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 공지사항 키조회 */
    @Override
    public Optional<SyNoticeDto.Item> selectById(String noticeId) {
        SyNoticeDto.Item dto = baseQuery().where(n.noticeId.eq(noticeId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 공지사항 목록조회 */
    @Override
    public List<SyNoticeDto.Item> selectList(SyNoticeDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyNoticeDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 공지사항 페이지조회 */
    @Override
    public SyNoticeDto.PageResponse selectPageList(SyNoticeDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyNoticeDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyNoticeDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(n.count()).from(n).where(where).fetchOne();

        SyNoticeDto.PageResponse res = new SyNoticeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 공지사항 baseQuery */
    private JPAQuery<SyNoticeDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyNoticeDto.Item.class,
                        n.noticeId, n.siteId, n.noticeTitle, n.noticeTypeCd, n.isFixed,
                        n.contentHtml, n.attachGrpId, n.startDate, n.endDate,
                        n.noticeStatusCd, n.viewCount,
                        n.regBy, n.regDate, n.updBy, n.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(n)
                .leftJoin(ste).on(ste.siteId.eq(n.siteId));
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanBuilder buildCondition(SyNoticeDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))       w.and(n.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getNoticeId()))     w.and(n.noticeId.eq(s.getNoticeId()));
        if (StringUtils.hasText(s.getStatus()))       w.and(n.noticeStatusCd.eq(s.getStatus()));
        if (StringUtils.hasText(s.getNoticeTypeCd())) w.and(n.noticeTypeCd.eq(s.getNoticeTypeCd()));
        if (StringUtils.hasText(s.getIsFixed()))      w.and(n.isFixed.eq(s.getIsFixed()));

        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchType() == null ? "" : s.getSearchType().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchType());
            String pattern = "%" + s.getSearchValue() + "%";
            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",noticeTitle,")) or.or(n.noticeTitle.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(n.regDate.goe(ds.atStartOfDay())).and(n.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(n.updDate.goe(ds.atStartOfDay())).and(n.updDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
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
    private List<OrderSpecifier<?>> buildOrder(SyNoticeDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, n.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("noticeId".equals(field)) {
                    orders.add(new OrderSpecifier(order, n.noticeId));
                } else if ("noticeTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, n.noticeTitle));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, n.regDate));
                }
            }
        }
        return orders;
    }

    /* 공지사항 수정 */
    @Override
    public int updateSelective(SyNotice entity) {
        if (entity.getNoticeId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(n);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(n.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getNoticeTitle()    != null) { update.set(n.noticeTitle,    entity.getNoticeTitle());    hasAny = true; }
        if (entity.getNoticeTypeCd()   != null) { update.set(n.noticeTypeCd,   entity.getNoticeTypeCd());   hasAny = true; }
        if (entity.getIsFixed()        != null) { update.set(n.isFixed,        entity.getIsFixed());        hasAny = true; }
        if (entity.getContentHtml()    != null) { update.set(n.contentHtml,    entity.getContentHtml());    hasAny = true; }
        if (entity.getAttachGrpId()    != null) { update.set(n.attachGrpId,    entity.getAttachGrpId());    hasAny = true; }
        if (entity.getStartDate()      != null) { update.set(n.startDate,      entity.getStartDate());      hasAny = true; }
        if (entity.getEndDate()        != null) { update.set(n.endDate,        entity.getEndDate());        hasAny = true; }
        if (entity.getNoticeStatusCd() != null) { update.set(n.noticeStatusCd, entity.getNoticeStatusCd()); hasAny = true; }
        if (entity.getViewCount()      != null) { update.set(n.viewCount,      entity.getViewCount());      hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(n.updBy,          entity.getUpdBy());          hasAny = true; }
        if (entity.getUpdDate()        != null) { update.set(n.updDate,        entity.getUpdDate());        hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(n.noticeId.eq(entity.getNoticeId())).execute();
        return (int) affected;
    }
}
