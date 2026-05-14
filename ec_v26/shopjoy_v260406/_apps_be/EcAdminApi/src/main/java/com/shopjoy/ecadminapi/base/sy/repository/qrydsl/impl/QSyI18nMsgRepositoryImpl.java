package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nMsgDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18nMsg;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyI18nMsgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyI18nMsg QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyI18nMsgRepositoryImpl implements QSyI18nMsgRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyI18nMsg m = QSyI18nMsg.syI18nMsg;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Override
    public Optional<SyI18nMsgDto.Item> selectById(String i18nMsgId) {
        SyI18nMsgDto.Item dto = baseQuery().where(m.i18nMsgId.eq(i18nMsgId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<SyI18nMsgDto.Item> selectList(SyI18nMsgDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyI18nMsgDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public SyI18nMsgDto.PageResponse selectPageList(SyI18nMsgDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyI18nMsgDto.Item> query = baseQuery().where(where);
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyI18nMsgDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(m.count()).from(m).where(where).fetchOne();

        SyI18nMsgDto.PageResponse res = new SyI18nMsgDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private JPAQuery<SyI18nMsgDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyI18nMsgDto.Item.class,
                        m.i18nMsgId, m.i18nId, m.langCd, m.i18nMsg,
                        m.regBy, m.regDate, m.updBy, m.updDate
                ))
                .from(m);
    }

    private BooleanBuilder buildCondition(SyI18nMsgDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getI18nMsgId())) w.and(m.i18nMsgId.eq(s.getI18nMsgId()));
        if (StringUtils.hasText(s.getI18nId()))    w.and(m.i18nId.eq(s.getI18nId()));
        if (StringUtils.hasText(s.getLangCd()))    w.and(m.langCd.eq(s.getLangCd()));

        if (StringUtils.hasText(s.getDateStart()) && StringUtils.hasText(s.getDateEnd()) && StringUtils.hasText(s.getDateType())) {
            LocalDate ds = LocalDate.parse(s.getDateStart(), DF);
            LocalDate de = LocalDate.parse(s.getDateEnd(), DF);
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(m.regDate.goe(ds.atStartOfDay())).and(m.regDate.lt(de.plusDays(1).atStartOfDay()));
                    break;
                case "upd_date":
                    w.and(m.updDate.goe(ds.atStartOfDay())).and(m.updDate.lt(de.plusDays(1).atStartOfDay()));
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
    private List<OrderSpecifier<?>> buildOrder(SyI18nMsgDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, m.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("i18nMsgId".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.i18nMsgId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, m.regDate));
                }
            }
        }
        return orders;
    }

    @Override
    public int updateSelective(SyI18nMsg entity) {
        if (entity.getI18nMsgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(m);
        boolean hasAny = false;

        if (entity.getI18nId()  != null) { update.set(m.i18nId,  entity.getI18nId());  hasAny = true; }
        if (entity.getLangCd()  != null) { update.set(m.langCd,  entity.getLangCd());  hasAny = true; }
        if (entity.getI18nMsg() != null) { update.set(m.i18nMsg, entity.getI18nMsg()); hasAny = true; }
        if (entity.getUpdBy()   != null) { update.set(m.updBy,   entity.getUpdBy());   hasAny = true; }
        if (entity.getUpdDate() != null) { update.set(m.updDate, entity.getUpdDate()); hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(m.i18nMsgId.eq(entity.getI18nMsgId())).execute();
        return (int) affected;
    }
}
