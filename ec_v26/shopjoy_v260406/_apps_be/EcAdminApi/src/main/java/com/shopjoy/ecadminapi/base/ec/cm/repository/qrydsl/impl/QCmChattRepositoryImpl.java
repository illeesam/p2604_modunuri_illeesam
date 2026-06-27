package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChatt;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmChatt;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmChatt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmChattRepositoryImpl implements QCmChattRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmChattRepositoryImpl";
    private static final QCmChatt cmChatt = QCmChatt.cmChatt;

    private JPAQuery<CmChattDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmChattDto.Item.class,
                        cmChatt.chattId, cmChatt.siteId, cmChatt.subject,
                        cmChatt.chattStatusCd, cmChatt.chattStatusCdBefore,
                        cmChatt.lastMsgDate, cmChatt.chattMemo,
                        cmChatt.closeDate, cmChatt.closeReason,
                        cmChatt.regBy, cmChatt.regDate, cmChatt.updBy, cmChatt.updDate
                ))
                .from(cmChatt);
    }

    @Override
    public Optional<CmChattDto.Item> selectById(String chattId) {
        CmChattDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmChatt.chattId.eq(chattId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<CmChattDto.Item> selectList(CmChattDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmChattDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                        andSiteId(search),
                        andChattId(search),
                        andChattStatusCd(search),
                        andDateRange(search),
                        andSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            query.offset((long) (pageNo - 1) * pageSize).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public CmChattDto.PageResponse selectPageData(CmChattDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteId(search),
                andChattId(search),
                andChattStatusCd(search),
                andDateRange(search),
                andSearchValue(search)
        };

        JPAQuery<CmChattDto.Item> base = baseSelColumnQuery();

        List<CmChattDto.Item> content = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset((long) (pageNo - 1) * pageSize).limit(pageSize)
                .fetch();

        Long total = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmChatt.count())
                .where(wheres)
                .fetchOne();

        CmChattDto.PageResponse res = new CmChattDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanExpression andSiteId(CmChattDto.Request s) {
        return s != null && StringUtils.hasText(s.getSiteId()) ? cmChatt.siteId.eq(s.getSiteId()) : null;
    }

    private BooleanExpression andChattId(CmChattDto.Request s) {
        return s != null && StringUtils.hasText(s.getChattId()) ? cmChatt.chattId.eq(s.getChattId()) : null;
    }

    private BooleanExpression andChattStatusCd(CmChattDto.Request s) {
        return s != null && StringUtils.hasText(s.getChattStatusCd()) ? cmChatt.chattStatusCd.eq(s.getChattStatusCd()) : null;
    }

    private BooleanExpression andDateRange(CmChattDto.Request s) {
        if (s == null || !StringUtils.hasText(s.getDateType())
                || !StringUtils.hasText(s.getDateStart()) || !StringUtils.hasText(s.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        return switch (s.getDateType()) {
            case "reg_date" -> cmChatt.regDate.goe(start).and(cmChatt.regDate.lt(endExcl));
            case "upd_date" -> cmChatt.updDate.goe(start).and(cmChatt.updDate.lt(endExcl));
            default -> null;
        };
    }

    private BooleanExpression andSearchValue(CmChattDto.Request s) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return null;
        String pattern = "%" + s.getSearchValue() + "%";
        String typeRaw = s.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",chattId,",    cmChatt.chattId,    pattern);
        or = orLike(or, all, types, ",subject,",    cmChatt.subject,    pattern);
        or = orLike(or, all, types, ",chattMemo,",  cmChatt.chattMemo,  pattern);
        or = orLike(or, all, types, ",closeReason,",cmChatt.closeReason,pattern);
        return or;
    }

    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmChattDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, cmChatt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmChatt.chattId));
            return orders;
        }
        for (String part : sort.split(",")) {
            String[] fd = part.trim().split(" ");
            if (fd.length == 2) {
                Order ord = "desc".equalsIgnoreCase(fd[1]) ? Order.DESC : Order.ASC;
                if ("chattId".equals(fd[0]))  orders.add(new OrderSpecifier(ord, cmChatt.chattId));
                else if ("regDate".equals(fd[0])) orders.add(new OrderSpecifier(ord, cmChatt.regDate));
            }
        }
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, cmChatt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC,  cmChatt.chattId));
        }
        return orders;
    }

    @Override
    public int updateSelective(CmChatt entity) {
        if (entity.getChattId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmChatt);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(cmChatt.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getSubject()             != null) { update.set(cmChatt.subject,             entity.getSubject());             hasAny = true; }
        if (entity.getChattStatusCd()       != null) { update.set(cmChatt.chattStatusCd,       entity.getChattStatusCd());       hasAny = true; }
        if (entity.getChattStatusCdBefore() != null) { update.set(cmChatt.chattStatusCdBefore, entity.getChattStatusCdBefore()); hasAny = true; }
        if (entity.getLastMsgDate()         != null) { update.set(cmChatt.lastMsgDate,         entity.getLastMsgDate());         hasAny = true; }
        if (entity.getChattMemo()           != null) { update.set(cmChatt.chattMemo,           entity.getChattMemo());           hasAny = true; }
        if (entity.getCloseDate()           != null) { update.set(cmChatt.closeDate,           entity.getCloseDate());           hasAny = true; }
        if (entity.getCloseReason()         != null) { update.set(cmChatt.closeReason,         entity.getCloseReason());         hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(cmChatt.updBy,               entity.getUpdBy());               hasAny = true; }
        update.set(cmChatt.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmChatt.chattId.eq(entity.getChattId())).execute();
        return (int) affected;
    }
}
