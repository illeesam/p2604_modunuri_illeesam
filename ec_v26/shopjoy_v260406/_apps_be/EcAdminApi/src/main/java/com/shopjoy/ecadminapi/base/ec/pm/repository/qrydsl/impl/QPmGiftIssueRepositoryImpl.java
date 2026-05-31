package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmGiftIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGift;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmGiftIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmGiftIssueRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmGiftIssue QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmGiftIssueRepositoryImpl implements QPmGiftIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmGiftIssueRepositoryImpl";
    private static final QPmGiftIssue i    = QPmGiftIssue.pmGiftIssue;
    private static final QPmGift      gif  = QPmGift.pmGift;
    private static final QMbMember    mem  = QMbMember.mbMember;
    private static final QOdOrder     ord  = QOdOrder.odOrder;
    private static final QSySite      ste  = QSySite.sySite;
    private static final QSyCode      cdGis = new QSyCode("cd_gis");

    /* 사은품 발행 이력 baseQuery */
    private JPAQuery<PmGiftIssueDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(PmGiftIssueDto.Item.class,
                        i.giftIssueId, i.giftId, i.siteId, i.memberId, i.orderId,
                        i.issueDate, i.giftIssueStatusCd, i.giftIssueStatusCdBefore,
                        i.giftIssueMemo, i.regBy, i.regDate, i.updBy, i.updDate
                ))
                .from(i)
                .leftJoin(gif).on(gif.giftId.eq(i.giftId))
                .leftJoin(mem).on(mem.memberId.eq(i.memberId))
                .leftJoin(ord).on(ord.orderId.eq(i.orderId))
                .leftJoin(ste).on(ste.siteId.eq(i.siteId))
                .leftJoin(cdGis).on(cdGis.codeGrp.eq("GIFT_ISSUE_STATUS").and(cdGis.codeValue.eq(i.giftIssueStatusCd)));
    }

    /* 사은품 발행 이력 키조회 */
    @Override
    public Optional<PmGiftIssueDto.Item> selectById(String giftIssueId) {
        PmGiftIssueDto.Item dto = baseQuery()
                .where(i.giftIssueId.eq(giftIssueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 사은품 발행 이력 목록조회 */
    @Override
    public List<PmGiftIssueDto.Item> selectList(PmGiftIssueDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftIssueDto.Item> query = baseQuery().where(
                andSiteId(search),
                andGiftIssueId(search),
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

    /* 사은품 발행 이력 페이지조회 */
    @Override
    public PmGiftIssueDto.PageResponse selectPageList(PmGiftIssueDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmGiftIssueDto.Item> query = baseQuery().where(
                andSiteId(search),
                andGiftIssueId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmGiftIssueDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(i.count())
                .from(i)
                .where(
                andSiteId(search),
                andGiftIssueId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        PmGiftIssueDto.PageResponse res = new PmGiftIssueDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 사은품 발행 이력 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(PmGiftIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? i.siteId.eq(search.getSiteId()) : null;
    }

    /* giftIssueId 정확 일치 */
    private BooleanExpression andGiftIssueId(PmGiftIssueDto.Request search) {
        return search != null && StringUtils.hasText(search.getGiftIssueId())
                ? i.giftIssueId.eq(search.getGiftIssueId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(PmGiftIssueDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "issue_date": return i.issueDate.goe(start).and(i.issueDate.lt(endExcl));
            case "reg_date": return i.regDate.goe(start).and(i.regDate.lt(endExcl));
            case "upd_date": return i.updDate.goe(start).and(i.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(PmGiftIssueDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",giftId,", i.giftId, pattern);
        or = orLike(or, all, types, ",giftIssueId,", i.giftIssueId, pattern);
        or = orLike(or, all, types, ",giftIssueMemo,", i.giftIssueMemo, pattern);
        or = orLike(or, all, types, ",giftIssueStatusCd,", i.giftIssueStatusCd, pattern);
        or = orLike(or, all, types, ",giftIssueStatusCdBefore,", i.giftIssueStatusCdBefore, pattern);
        or = orLike(or, all, types, ",memberId,", i.memberId, pattern);
        or = orLike(or, all, types, ",orderId,", i.orderId, pattern);
        or = orLike(or, all, types, ",siteId,", i.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmGiftIssueDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.giftIssueId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("giftIssueId".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.giftIssueId));
                } else if ("issueDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, i.issueDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, i.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, i.giftIssueId));
        }
        return orders;
    }

    /* 사은품 발행 이력 수정 */
    @Override
    public int updateSelective(PmGiftIssue entity) {
        if (entity.getGiftIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(i);
        boolean hasAny = false;

        if (entity.getGiftId()                 != null) { update.set(i.giftId,                 entity.getGiftId());                 hasAny = true; }
        if (entity.getSiteId()                 != null) { update.set(i.siteId,                 entity.getSiteId());                 hasAny = true; }
        if (entity.getMemberId()               != null) { update.set(i.memberId,               entity.getMemberId());               hasAny = true; }
        if (entity.getOrderId()                != null) { update.set(i.orderId,                entity.getOrderId());                hasAny = true; }
        if (entity.getIssueDate()              != null) { update.set(i.issueDate,              entity.getIssueDate());              hasAny = true; }
        if (entity.getGiftIssueStatusCd()      != null) { update.set(i.giftIssueStatusCd,      entity.getGiftIssueStatusCd());      hasAny = true; }
        if (entity.getGiftIssueStatusCdBefore()!= null) { update.set(i.giftIssueStatusCdBefore,entity.getGiftIssueStatusCdBefore());hasAny = true; }
        if (entity.getGiftIssueMemo()          != null) { update.set(i.giftIssueMemo,          entity.getGiftIssueMemo());          hasAny = true; }
        if (entity.getUpdBy()                  != null) { update.set(i.updBy,                  entity.getUpdBy());                  hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(i.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(i.giftIssueId.eq(entity.getGiftIssueId())).execute();
        return (int) affected;
    }
}
