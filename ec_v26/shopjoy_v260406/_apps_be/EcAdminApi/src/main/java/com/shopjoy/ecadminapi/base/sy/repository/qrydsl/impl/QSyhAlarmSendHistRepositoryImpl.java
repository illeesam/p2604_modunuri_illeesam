package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
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
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhAlarmSendHistRepositoryImpl";
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
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(h.sendHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 알람 발송 이력 목록조회 */
    @Override
    public List<SyhAlarmSendHistDto.Item> selectList(SyhAlarmSendHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhAlarmSendHistDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andSiteId(search),
                andSendHistId(search),
                andStatus(search),
                andDateRange(search),
                andSearchValue(search)
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

    /* 알람 발송 이력 페이지조회 */
    @Override
    public SyhAlarmSendHistDto.PageResponse selectPageList(SyhAlarmSendHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhAlarmSendHistDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                andSiteId(search),
                andSendHistId(search),
                andStatus(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhAlarmSendHistDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(h.count())
                .from(h)
                .where(
                andSiteId(search),
                andSendHistId(search),
                andStatus(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        SyhAlarmSendHistDto.PageResponse res = new SyhAlarmSendHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 알람 발송 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyhAlarmSendHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? h.siteId.eq(search.getSiteId()) : null;
    }

    /* sendHistId 정확 일치 */
    private BooleanExpression andSendHistId(SyhAlarmSendHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSendHistId())
                ? h.sendHistId.eq(search.getSendHistId()) : null;
    }

    /* sendHistStatusCd 정확 일치 */
    private BooleanExpression andStatus(SyhAlarmSendHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? h.sendHistStatusCd.eq(search.getStatus()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(SyhAlarmSendHistDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "send_date": return h.sendDate.goe(start).and(h.sendDate.lt(endExcl));
            case "reg_date": return h.regDate.goe(start).and(h.regDate.lt(endExcl));
            case "upd_date": return h.updDate.goe(start).and(h.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyhAlarmSendHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",alarmId,", h.alarmId, pattern);
        or = orLike(or, all, types, ",channel,", h.channel, pattern);
        or = orLike(or, all, types, ",errorMsg,", h.errorMsg, pattern);
        or = orLike(or, all, types, ",memberId,", h.memberId, pattern);
        or = orLike(or, all, types, ",sendHistId,", h.sendHistId, pattern);
        or = orLike(or, all, types, ",sendHistStatusCd,", h.sendHistStatusCd, pattern);
        or = orLike(or, all, types, ",sendTo,", h.sendTo, pattern);
        or = orLike(or, all, types, ",siteId,", h.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyhAlarmSendHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, h.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, h.sendHistId));
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
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, h.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, h.sendHistId));
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(h.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(h.sendHistId.eq(entity.getSendHistId())).execute();
        return (int) affected;
    }
}
