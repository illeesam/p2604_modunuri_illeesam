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
    private static final QSyhAlarmSendHist syhAlarmSendHist   = QSyhAlarmSendHist.syhAlarmSendHist;
    private static final QSySite           sySite = QSySite.sySite;

    /* 알람 발송 이력 baseSelColumnQuery */
    private JPAQuery<SyhAlarmSendHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhAlarmSendHistDto.Item.class,
                        syhAlarmSendHist.sendHistId,
                        syhAlarmSendHist.siteId,
                        syhAlarmSendHist.alarmId,
                        syhAlarmSendHist.memberId,
                        syhAlarmSendHist.userId,
                        syhAlarmSendHist.channel,
                        syhAlarmSendHist.sendTo,
                        syhAlarmSendHist.sendDate,
                        syhAlarmSendHist.sendHistStatusCd,
                        syhAlarmSendHist.errorMsg,
                        syhAlarmSendHist.regBy,
                        syhAlarmSendHist.regDate,
                        syhAlarmSendHist.updBy,
                        syhAlarmSendHist.updDate,
                        sySite.siteNm.as("siteNm")
                ))
                .from(syhAlarmSendHist)
                .leftJoin(sySite).on(sySite.siteId.eq(syhAlarmSendHist.siteId));
    }

    /* 알람 발송 이력 키조회 */
    @Override
    public Optional<SyhAlarmSendHistDto.Item> selectById(String id) {
        SyhAlarmSendHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhAlarmSendHist.sendHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 알람 발송 이력 목록조회 */
    @Override
    public List<SyhAlarmSendHistDto.Item> selectList(SyhAlarmSendHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhAlarmSendHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andSiteIdEq(search),
                andSendHistIdEq(search),
                andStatusEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
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

    /* 알람 발송 이력 페이지조회 */
    @Override
    public SyhAlarmSendHistDto.PageResponse selectPageData(SyhAlarmSendHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andSendHistIdEq(search),
                andStatusEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyhAlarmSendHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyhAlarmSendHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhAlarmSendHist.count())
                .where(wheres)
                .fetchOne();

        SyhAlarmSendHistDto.PageResponse res = new SyhAlarmSendHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 알람 발송 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(SyhAlarmSendHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syhAlarmSendHist.siteId.eq(search.getSiteId()) : null;
    }

    /* sendHistId 정확 일치 */
    private BooleanExpression andSendHistIdEq(SyhAlarmSendHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getSendHistId())
                ? syhAlarmSendHist.sendHistId.eq(search.getSendHistId()) : null;
    }

    /* sendHistStatusCd 정확 일치 */
    private BooleanExpression andStatusEq(SyhAlarmSendHistDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? syhAlarmSendHist.sendHistStatusCd.eq(search.getStatus()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(SyhAlarmSendHistDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "send_date": return syhAlarmSendHist.sendDate.goe(start).and(syhAlarmSendHist.sendDate.lt(endExcl));
            case "reg_date": return syhAlarmSendHist.regDate.goe(start).and(syhAlarmSendHist.regDate.lt(endExcl));
            case "upd_date": return syhAlarmSendHist.updDate.goe(start).and(syhAlarmSendHist.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(SyhAlarmSendHistDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",alarmId,", syhAlarmSendHist.alarmId, pattern);
        or = orLike(or, all, types, ",channel,", syhAlarmSendHist.channel, pattern);
        or = orLike(or, all, types, ",errorMsg,", syhAlarmSendHist.errorMsg, pattern);
        or = orLike(or, all, types, ",memberId,", syhAlarmSendHist.memberId, pattern);
        or = orLike(or, all, types, ",userId,", syhAlarmSendHist.userId, pattern);
        or = orLike(or, all, types, ",sendHistId,", syhAlarmSendHist.sendHistId, pattern);
        or = orLike(or, all, types, ",sendHistStatusCd,", syhAlarmSendHist.sendHistStatusCd, pattern);
        or = orLike(or, all, types, ",sendTo,", syhAlarmSendHist.sendTo, pattern);
        or = orLike(or, all, types, ",siteId,", syhAlarmSendHist.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, syhAlarmSendHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhAlarmSendHist.sendHistId));
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
                    orders.add(new OrderSpecifier(order, syhAlarmSendHist.sendHistId));
                } else if ("sendDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhAlarmSendHist.sendDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhAlarmSendHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhAlarmSendHist.sendHistId));
        }
        return orders;
    }

    /* 알람 발송 이력 수정 */
    @Override
    public int updateSelective(SyhAlarmSendHist entity) {
        if (entity.getSendHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhAlarmSendHist);
        boolean hasAny = false;

        if (entity.getSiteId()           != null) { update.set(syhAlarmSendHist.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getAlarmId()          != null) { update.set(syhAlarmSendHist.alarmId,          entity.getAlarmId());          hasAny = true; }
        if (entity.getMemberId()         != null) { update.set(syhAlarmSendHist.memberId,         entity.getMemberId());         hasAny = true; }
        if (entity.getUserId()           != null) { update.set(syhAlarmSendHist.userId,           entity.getUserId());           hasAny = true; }
        if (entity.getChannel()          != null) { update.set(syhAlarmSendHist.channel,          entity.getChannel());          hasAny = true; }
        if (entity.getSendTo()           != null) { update.set(syhAlarmSendHist.sendTo,           entity.getSendTo());           hasAny = true; }
        if (entity.getSendDate()         != null) { update.set(syhAlarmSendHist.sendDate,         entity.getSendDate());         hasAny = true; }
        if (entity.getSendHistStatusCd() != null) { update.set(syhAlarmSendHist.sendHistStatusCd, entity.getSendHistStatusCd()); hasAny = true; }
        if (entity.getErrorMsg()         != null) { update.set(syhAlarmSendHist.errorMsg,         entity.getErrorMsg());         hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(syhAlarmSendHist.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syhAlarmSendHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhAlarmSendHist.sendHistId.eq(entity.getSendHistId())).execute();
        return (int) affected;
    }
}
