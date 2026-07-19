package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmhPushLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmhPushLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmhPushLogRepositoryImpl implements QCmhPushLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmhPushLogRepositoryImpl";
    private static final QCmhPushLog cmhPushLog = QCmhPushLog.cmhPushLog;

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmhPushLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmhPushLogDto.Item.class,
                        cmhPushLog.logId, cmhPushLog.siteId, cmhPushLog.channelCd, cmhPushLog.templateId, cmhPushLog.memberId,
                        cmhPushLog.recvAddr, cmhPushLog.pushLogTitle, cmhPushLog.pushLogContent,
                        cmhPushLog.resultCd, cmhPushLog.failReason, cmhPushLog.sendDate,
                        cmhPushLog.refTypeCd, cmhPushLog.refId,
                        cmhPushLog.regBy, cmhPushLog.regDate, cmhPushLog.updBy, cmhPushLog.updDate
                ))
                .from(cmhPushLog);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmhPushLogDto.Item> selectById(String logId) {
        CmhPushLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmhPushLog.logId.eq(logId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmhPushLogDto.Item> selectList(CmhPushLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmhPushLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andSiteIdEq(search),
                andLogIdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /** 페이지 목록 */
    @Override
    public CmhPushLogDto.PageResponse selectPageData(CmhPushLogDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                andSiteIdEq(search),
                andLogIdEq(search),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<CmhPushLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<CmhPushLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmhPushLog.count())
                .where(wheres)
                .fetchOne();

        CmhPushLogDto.PageResponse res = new CmhPushLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteIdEq(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteIdEq(CmhPushLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? cmhPushLog.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression andLogIdEq(CmhPushLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? cmhPushLog.logId.eq(search.getLogId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRangeBetween(CmhPushLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "send_date": return cmhPushLog.sendDate.goe(start).and(cmhPushLog.sendDate.lt(endExcl));
            case "reg_date": return cmhPushLog.regDate.goe(start).and(cmhPushLog.regDate.lt(endExcl));
            case "upd_date": return cmhPushLog.updDate.goe(start).and(cmhPushLog.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValueLike(CmhPushLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",channelCd,", cmhPushLog.channelCd, pattern);
        or = orLike(or, all, types, ",failReason,", cmhPushLog.failReason, pattern);
        or = orLike(or, all, types, ",logId,", cmhPushLog.logId, pattern);
        or = orLike(or, all, types, ",memberId,", cmhPushLog.memberId, pattern);
        or = orLike(or, all, types, ",pushLogContent,", cmhPushLog.pushLogContent, pattern);
        or = orLike(or, all, types, ",pushLogTitle,", cmhPushLog.pushLogTitle, pattern);
        or = orLike(or, all, types, ",recvAddr,", cmhPushLog.recvAddr, pattern);
        or = orLike(or, all, types, ",refId,", cmhPushLog.refId, pattern);
        or = orLike(or, all, types, ",refTypeCd,", cmhPushLog.refTypeCd, pattern);
        or = orLike(or, all, types, ",resultCd,", cmhPushLog.resultCd, pattern);
        or = orLike(or, all, types, ",siteId,", cmhPushLog.siteId, pattern);
        or = orLike(or, all, types, ",templateId,", cmhPushLog.templateId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(CmhPushLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, cmhPushLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmhPushLog.logId));
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
                    orders.add(new OrderSpecifier(order, cmhPushLog.logId));
                } else if ("pushLogTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmhPushLog.pushLogTitle));
                } else if ("sendDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmhPushLog.sendDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, cmhPushLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmhPushLog.logId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 에 update 미정의이나 Mapper Java 에 선언되어 있어 Entity 모든 갱신 필드 대상으로 처리 */
    @Override
    public int updateSelective(CmhPushLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmhPushLog);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(cmhPushLog.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getChannelCd()      != null) { update.set(cmhPushLog.channelCd,      entity.getChannelCd());      hasAny = true; }
        if (entity.getTemplateId()     != null) { update.set(cmhPushLog.templateId,     entity.getTemplateId());     hasAny = true; }
        if (entity.getMemberId()       != null) { update.set(cmhPushLog.memberId,       entity.getMemberId());       hasAny = true; }
        if (entity.getRecvAddr()       != null) { update.set(cmhPushLog.recvAddr,       entity.getRecvAddr());       hasAny = true; }
        if (entity.getPushLogTitle()   != null) { update.set(cmhPushLog.pushLogTitle,   entity.getPushLogTitle());   hasAny = true; }
        if (entity.getPushLogContent() != null) { update.set(cmhPushLog.pushLogContent, entity.getPushLogContent()); hasAny = true; }
        if (entity.getResultCd()       != null) { update.set(cmhPushLog.resultCd,       entity.getResultCd());       hasAny = true; }
        if (entity.getFailReason()     != null) { update.set(cmhPushLog.failReason,     entity.getFailReason());     hasAny = true; }
        if (entity.getSendDate()       != null) { update.set(cmhPushLog.sendDate,       entity.getSendDate());       hasAny = true; }
        if (entity.getRefTypeCd()      != null) { update.set(cmhPushLog.refTypeCd,      entity.getRefTypeCd());      hasAny = true; }
        if (entity.getRefId()          != null) { update.set(cmhPushLog.refId,          entity.getRefId());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(cmhPushLog.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(cmhPushLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmhPushLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
