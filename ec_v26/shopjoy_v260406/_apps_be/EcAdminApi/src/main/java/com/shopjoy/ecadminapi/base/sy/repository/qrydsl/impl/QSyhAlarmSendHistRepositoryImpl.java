package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhAlarmSendHist;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhAlarmSendHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** SyhAlarmSendHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhAlarmSendHistRepositoryImpl implements QSyhAlarmSendHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyhAlarmSendHist h   = QSyhAlarmSendHist.syhAlarmSendHist;
    private static final QSySite           ste = QSySite.sySite;

    /* 알람 발송 이력 buildBaseQuery */
    private JPAQuery<SyhAlarmSendHistDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyhAlarmSendHistDto.Item.class,
                        h.sendHistId,
                        h.siteId,
                        h.alarmId,
                        h.memberId,
                        h.channel,
                        h.sendTo,
                        h.sendDate,
                        h.sendHistStatusCd,
                        h.errorMsg,
                        h.regBy,
                        h.regDate,
                        h.updBy,
                        h.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(h)
                .leftJoin(ste).on(ste.siteId.eq(h.siteId));
    }

    /* 알람 발송 이력 키조회 */
    @Override
    public Optional<SyhAlarmSendHistDto.Item> selectById(String id) {
        SyhAlarmSendHistDto.Item dto = buildBaseQuery()
                .where(h.sendHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 알람 발송 이력 목록조회 */
    @Override
    public List<SyhAlarmSendHistDto.Item> selectList(SyhAlarmSendHistDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhAlarmSendHistDto.Item> query = buildBaseQuery().where(where);
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

    /* 알람 발송 이력 페이지조회 */
    @Override
    public SyhAlarmSendHistDto.PageResponse selectPageList(SyhAlarmSendHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhAlarmSendHistDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhAlarmSendHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(h.count())
                .from(h)
                .where(where)
                .fetchOne();

        SyhAlarmSendHistDto.PageResponse res = new SyhAlarmSendHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 알람 발송 이력 buildCondition */
    private BooleanBuilder buildCondition(SyhAlarmSendHistDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))     w.and(h.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getSendHistId())) w.and(h.sendHistId.eq(s.getSendHistId()));
        if (StringUtils.hasText(s.getStatus()))     w.and(h.sendHistStatusCd.eq(s.getStatus()));

        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start   = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "send_date":
                    w.and(h.sendDate.goe(start)).and(h.sendDate.lt(endExcl));
                    break;
                case "reg_date":
                    w.and(h.regDate.goe(start)).and(h.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(h.updDate.goe(start)).and(h.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhAlarmSendHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("sendHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.sendHistId));
                } else if ("sendDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, h.sendDate));
                }
            }
        }
        return orders;
    }

    /* 알람 발송 이력 수정 */
    @Override
    public int updateSelective(SyhAlarmSendHist entity) {
        if (entity.getSendHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(h);
        boolean hasAny = false;

        if (entity.getSiteId()           != null) { update.set(h.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getAlarmId()          != null) { update.set(h.alarmId,          entity.getAlarmId());          hasAny = true; }
        if (entity.getMemberId()         != null) { update.set(h.memberId,         entity.getMemberId());         hasAny = true; }
        if (entity.getChannel()          != null) { update.set(h.channel,          entity.getChannel());          hasAny = true; }
        if (entity.getSendTo()           != null) { update.set(h.sendTo,           entity.getSendTo());           hasAny = true; }
        if (entity.getSendDate()         != null) { update.set(h.sendDate,         entity.getSendDate());         hasAny = true; }
        if (entity.getSendHistStatusCd() != null) { update.set(h.sendHistStatusCd, entity.getSendHistStatusCd()); hasAny = true; }
        if (entity.getErrorMsg()         != null) { update.set(h.errorMsg,         entity.getErrorMsg());         hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(h.updBy,            entity.getUpdBy());            hasAny = true; }
        if (entity.getUpdDate()          != null) { update.set(h.updDate,          entity.getUpdDate());          hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(h.sendHistId.eq(entity.getSendHistId())).execute();
        return (int) affected;
    }
}
