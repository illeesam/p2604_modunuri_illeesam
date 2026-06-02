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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmChattRoom;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmChattRoom QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmChattRoomRepositoryImpl implements QCmChattRoomRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmChattRoomRepositoryImpl";
    private static final QCmChattRoom cmChattRoom = QCmChattRoom.cmChattRoom;

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmChattRoomDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmChattRoomDto.Item.class,
                        cmChattRoom.chattRoomId, cmChattRoom.siteId, cmChattRoom.memberId, cmChattRoom.memberNm,
                        cmChattRoom.adminUserId, cmChattRoom.subject, cmChattRoom.chattStatusCd, cmChattRoom.chattStatusCdBefore,
                        cmChattRoom.lastMsgDate, cmChattRoom.memberUnreadCnt, cmChattRoom.adminUnreadCnt,
                        cmChattRoom.chattMemo, cmChattRoom.closeDate, cmChattRoom.closeReason,
                        cmChattRoom.regBy, cmChattRoom.regDate, cmChattRoom.updBy, cmChattRoom.updDate
                ))
                .from(cmChattRoom);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmChattRoomDto.Item> selectById(String chattRoomId) {
        CmChattRoomDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmChattRoom.chattRoomId.eq(chattRoomId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmChattRoomDto.Item> selectList(CmChattRoomDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmChattRoomDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndChattRoomId(search),
                baseAndMemberId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /** 페이지 목록 */
    @Override
    public CmChattRoomDto.PageResponse selectPageData(CmChattRoomDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmChattRoomDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(
                baseAndSiteId(search),
                baseAndChattRoomId(search),
                baseAndMemberId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmChattRoomDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(cmChattRoom.count())
                .from(cmChattRoom)
                .where(
                baseAndSiteId(search),
                baseAndChattRoomId(search),
                baseAndMemberId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        CmChattRoomDto.PageResponse res = new CmChattRoomDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(CmChattRoomDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? cmChattRoom.siteId.eq(search.getSiteId()) : null;
    }

    /* chattRoomId 정확 일치 */
    private BooleanExpression baseAndChattRoomId(CmChattRoomDto.Request search) {
        return search != null && StringUtils.hasText(search.getChattRoomId())
                ? cmChattRoom.chattRoomId.eq(search.getChattRoomId()) : null;
    }

    /* memberId 정확 일치 */
    private BooleanExpression baseAndMemberId(CmChattRoomDto.Request search) {
        return search != null && StringUtils.hasText(search.getMemberId())
                ? cmChattRoom.memberId.eq(search.getMemberId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(CmChattRoomDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return cmChattRoom.regDate.goe(start).and(cmChattRoom.regDate.lt(endExcl));
            case "upd_date": return cmChattRoom.updDate.goe(start).and(cmChattRoom.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(CmChattRoomDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",adminUserId,", cmChattRoom.adminUserId, pattern);
        or = orLike(or, all, types, ",chattMemo,", cmChattRoom.chattMemo, pattern);
        or = orLike(or, all, types, ",chattRoomId,", cmChattRoom.chattRoomId, pattern);
        or = orLike(or, all, types, ",chattStatusCd,", cmChattRoom.chattStatusCd, pattern);
        or = orLike(or, all, types, ",chattStatusCdBefore,", cmChattRoom.chattStatusCdBefore, pattern);
        or = orLike(or, all, types, ",closeReason,", cmChattRoom.closeReason, pattern);
        or = orLike(or, all, types, ",memberId,", cmChattRoom.memberId, pattern);
        or = orLike(or, all, types, ",memberNm,", cmChattRoom.memberNm, pattern);
        or = orLike(or, all, types, ",siteId,", cmChattRoom.siteId, pattern);
        or = orLike(or, all, types, ",subject,", cmChattRoom.subject, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(CmChattRoomDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, cmChattRoom.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmChattRoom.chattRoomId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("chattRoomId".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmChattRoom.chattRoomId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmChattRoom.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmChattRoom.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, cmChattRoom.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmChattRoom.chattRoomId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmChattRoom entity) {
        if (entity.getChattRoomId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmChattRoom);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(cmChattRoom.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getMemberId()            != null) { update.set(cmChattRoom.memberId,            entity.getMemberId());            hasAny = true; }
        if (entity.getMemberNm()            != null) { update.set(cmChattRoom.memberNm,            entity.getMemberNm());            hasAny = true; }
        if (entity.getAdminUserId()         != null) { update.set(cmChattRoom.adminUserId,         entity.getAdminUserId());         hasAny = true; }
        if (entity.getSubject()             != null) { update.set(cmChattRoom.subject,             entity.getSubject());             hasAny = true; }
        if (entity.getChattStatusCd()       != null) { update.set(cmChattRoom.chattStatusCd,       entity.getChattStatusCd());       hasAny = true; }
        if (entity.getChattStatusCdBefore() != null) { update.set(cmChattRoom.chattStatusCdBefore, entity.getChattStatusCdBefore()); hasAny = true; }
        if (entity.getLastMsgDate()         != null) { update.set(cmChattRoom.lastMsgDate,         entity.getLastMsgDate());         hasAny = true; }
        if (entity.getMemberUnreadCnt()     != null) { update.set(cmChattRoom.memberUnreadCnt,     entity.getMemberUnreadCnt());     hasAny = true; }
        if (entity.getAdminUnreadCnt()      != null) { update.set(cmChattRoom.adminUnreadCnt,      entity.getAdminUnreadCnt());      hasAny = true; }
        if (entity.getChattMemo()           != null) { update.set(cmChattRoom.chattMemo,           entity.getChattMemo());           hasAny = true; }
        if (entity.getCloseDate()           != null) { update.set(cmChattRoom.closeDate,           entity.getCloseDate());           hasAny = true; }
        if (entity.getCloseReason()         != null) { update.set(cmChattRoom.closeReason,         entity.getCloseReason());         hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(cmChattRoom.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(cmChattRoom.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmChattRoom.chattRoomId.eq(entity.getChattRoomId())).execute();
        return (int) affected;
    }
}
