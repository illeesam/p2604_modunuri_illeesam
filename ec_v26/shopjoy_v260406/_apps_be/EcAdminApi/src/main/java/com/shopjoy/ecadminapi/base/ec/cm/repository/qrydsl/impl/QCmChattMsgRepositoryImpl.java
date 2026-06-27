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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattMsgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmChattMsg QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmChattMsgRepositoryImpl implements QCmChattMsgRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmChattMsgRepositoryImpl";
    private static final QCmChattMsg cmChattMsg = QCmChattMsg.cmChattMsg;

    private JPAQuery<CmChattMsgDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmChattMsgDto.Item.class,
                        cmChattMsg.chattMsgId, cmChattMsg.siteId, cmChattMsg.chattId,
                        cmChattMsg.senderTypeCd, cmChattMsg.senderId, cmChattMsg.senderNm,
                        cmChattMsg.msgText, cmChattMsg.msgTypeCd, cmChattMsg.attachGrpId,
                        cmChattMsg.refType, cmChattMsg.refId,
                        cmChattMsg.readYn, cmChattMsg.sendDate,
                        cmChattMsg.regBy, cmChattMsg.regDate, cmChattMsg.updBy, cmChattMsg.updDate
                ))
                .from(cmChattMsg);
    }

    @Override
    public Optional<CmChattMsgDto.Item> selectById(String chattMsgId) {
        CmChattMsgDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmChattMsg.chattMsgId.eq(chattMsgId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<CmChattMsgDto.Item> selectList(CmChattMsgDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmChattMsgDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                        andSiteId(search),
                        andChattMsgId(search),
                        andChattId(search),
                        andSenderId(search),
                        andAfterMsgId(search),
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
    public CmChattMsgDto.PageResponse selectPageData(CmChattMsgDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteId(search),
                andChattMsgId(search),
                andChattId(search),
                andSenderId(search),
                andAfterMsgId(search),
                andDateRange(search),
                andSearchValue(search)
        };

        JPAQuery<CmChattMsgDto.Item> base = baseSelColumnQuery();

        List<CmChattMsgDto.Item> content = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset((long) (pageNo - 1) * pageSize).limit(pageSize)
                .fetch();

        Long total = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmChattMsg.count())
                .where(wheres)
                .fetchOne();

        CmChattMsgDto.PageResponse res = new CmChattMsgDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    private BooleanExpression andSiteId(CmChattMsgDto.Request s) {
        return s != null && StringUtils.hasText(s.getSiteId()) ? cmChattMsg.siteId.eq(s.getSiteId()) : null;
    }

    private BooleanExpression andChattMsgId(CmChattMsgDto.Request s) {
        return s != null && StringUtils.hasText(s.getChattMsgId()) ? cmChattMsg.chattMsgId.eq(s.getChattMsgId()) : null;
    }

    private BooleanExpression andChattId(CmChattMsgDto.Request s) {
        return s != null && StringUtils.hasText(s.getChattId()) ? cmChattMsg.chattId.eq(s.getChattId()) : null;
    }

    private BooleanExpression andSenderId(CmChattMsgDto.Request s) {
        return s != null && StringUtils.hasText(s.getSenderId()) ? cmChattMsg.senderId.eq(s.getSenderId()) : null;
    }

    /** afterMsgId: 해당 msgId 이후 메시지만 조회 (채팅 풀링용) */
    private BooleanExpression andAfterMsgId(CmChattMsgDto.Request s) {
        return s != null && StringUtils.hasText(s.getAfterMsgId())
                ? cmChattMsg.chattMsgId.gt(s.getAfterMsgId()) : null;
    }

    private BooleanExpression andDateRange(CmChattMsgDto.Request s) {
        if (s == null || !StringUtils.hasText(s.getDateType())
                || !StringUtils.hasText(s.getDateStart()) || !StringUtils.hasText(s.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        return switch (s.getDateType()) {
            case "send_date" -> cmChattMsg.sendDate.goe(start).and(cmChattMsg.sendDate.lt(endExcl));
            case "reg_date"  -> cmChattMsg.regDate.goe(start).and(cmChattMsg.regDate.lt(endExcl));
            case "upd_date"  -> cmChattMsg.updDate.goe(start).and(cmChattMsg.updDate.lt(endExcl));
            default -> null;
        };
    }

    private BooleanExpression andSearchValue(CmChattMsgDto.Request s) {
        if (s == null || !StringUtils.hasText(s.getSearchValue())) return null;
        String pattern = "%" + s.getSearchValue() + "%";
        String typeRaw = s.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",chattId,",       cmChattMsg.chattId,       pattern);
        or = orLike(or, all, types, ",senderNm,",      cmChattMsg.senderNm,      pattern);
        or = orLike(or, all, types, ",msgText,",        cmChattMsg.msgText,       pattern);
        or = orLike(or, all, types, ",refId,",          cmChattMsg.refId,         pattern);
        or = orLike(or, all, types, ",refType,",        cmChattMsg.refType,       pattern);
        return or;
    }

    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
    }

    @SuppressWarnings({"rawtypes", "unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmChattMsgDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.ASC, cmChattMsg.sendDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmChattMsg.chattMsgId));
            return orders;
        }
        for (String part : sort.split(",")) {
            String[] fd = part.trim().split(" ");
            if (fd.length == 2) {
                Order ord = "desc".equalsIgnoreCase(fd[1]) ? Order.DESC : Order.ASC;
                if      ("sendDate".equals(fd[0]))  orders.add(new OrderSpecifier(ord, cmChattMsg.sendDate));
                else if ("regDate".equals(fd[0]))   orders.add(new OrderSpecifier(ord, cmChattMsg.regDate));
                else if ("chattMsgId".equals(fd[0]))orders.add(new OrderSpecifier(ord, cmChattMsg.chattMsgId));
            }
        }
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, cmChattMsg.sendDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmChattMsg.chattMsgId));
        }
        return orders;
    }

    @Override
    public int updateSelective(CmChattMsg entity) {
        if (entity.getChattMsgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmChattMsg);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(cmChattMsg.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getChattId()      != null) { update.set(cmChattMsg.chattId,       entity.getChattId());      hasAny = true; }
        if (entity.getSenderTypeCd() != null) { update.set(cmChattMsg.senderTypeCd, entity.getSenderTypeCd()); hasAny = true; }
        if (entity.getSenderId()     != null) { update.set(cmChattMsg.senderId,      entity.getSenderId());     hasAny = true; }
        if (entity.getSenderNm()     != null) { update.set(cmChattMsg.senderNm,      entity.getSenderNm());     hasAny = true; }
        if (entity.getMsgText()      != null) { update.set(cmChattMsg.msgText,        entity.getMsgText());      hasAny = true; }
        if (entity.getMsgTypeCd()    != null) { update.set(cmChattMsg.msgTypeCd,     entity.getMsgTypeCd());    hasAny = true; }
        if (entity.getAttachGrpId()  != null) { update.set(cmChattMsg.attachGrpId,   entity.getAttachGrpId());  hasAny = true; }
        if (entity.getRefType()      != null) { update.set(cmChattMsg.refType,        entity.getRefType());      hasAny = true; }
        if (entity.getRefId()        != null) { update.set(cmChattMsg.refId,          entity.getRefId());        hasAny = true; }
        if (entity.getReadYn()       != null) { update.set(cmChattMsg.readYn,         entity.getReadYn());       hasAny = true; }
        if (entity.getSendDate()     != null) { update.set(cmChattMsg.sendDate,       entity.getSendDate());     hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(cmChattMsg.updBy,          entity.getUpdBy());        hasAny = true; }
        update.set(cmChattMsg.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmChattMsg.chattMsgId.eq(entity.getChattMsgId())).execute();
        return (int) affected;
    }
}
