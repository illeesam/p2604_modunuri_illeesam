package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleCloseRepository;
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
/** StSettleClose QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleCloseRepositoryImpl implements QStSettleCloseRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleCloseRepositoryImpl";
    private static final QStSettleClose c   = QStSettleClose.stSettleClose;
    private static final QSySite        ste = QSySite.sySite;
    private static final QSyCode        cdScs = new QSyCode("cd_scs");

    /* 정산 마감 키조회 */
    @Override
    public Optional<StSettleCloseDto.Item> selectById(String id) {
        StSettleCloseDto.Item dto = baseListQuery()
                .where(c.settleCloseId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 마감 목록조회 */
    @Override
    public List<StSettleCloseDto.Item> selectList(StSettleCloseDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleCloseDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andSettleCloseId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 정산 마감 페이지조회 */
    @Override
    public StSettleCloseDto.PageResponse selectPageList(StSettleCloseDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleCloseDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andSettleCloseId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleCloseDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(c.count())
                .from(c)
                .where(
                andSiteId(search),
                andSettleCloseId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        StSettleCloseDto.PageResponse res = new StSettleCloseDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 마감 baseListQuery */
    private JPAQuery<StSettleCloseDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleCloseDto.Item.class,
                        c.settleCloseId, c.settleId, c.siteId, c.closeStatusCd,
                        c.closeReason, c.finalSettleAmt, c.closeBy, c.closeDate,
                        c.regBy, c.regDate,
                        ste.siteNm.as("siteNm"),
                        cdScs.codeLabel.as("closeStatusCdNm")
                ))
                .from(c)
                .leftJoin(ste).on(ste.siteId.eq(c.siteId))
                .leftJoin(cdScs).on(cdScs.codeGrp.eq("SETTLE_CLOSE_STATUS").and(cdScs.codeValue.eq(c.closeStatusCd)));
    }

    /* 정산 마감 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(StSettleCloseDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? c.siteId.eq(search.getSiteId()) : null;
    }

    /* settleCloseId 정확 일치 */
    private BooleanExpression andSettleCloseId(StSettleCloseDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleCloseId())
                ? c.settleCloseId.eq(search.getSettleCloseId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(StSettleCloseDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return c.regDate.goe(start).and(c.regDate.lt(endExcl));
            case "upd_date": return c.updDate.goe(start).and(c.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(StSettleCloseDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",closeBy,", c.closeBy, pattern);
        or = orLike(or, all, types, ",closeReason,", c.closeReason, pattern);
        or = orLike(or, all, types, ",closeStatusCd,", c.closeStatusCd, pattern);
        or = orLike(or, all, types, ",settleCloseId,", c.settleCloseId, pattern);
        or = orLike(or, all, types, ",settleId,", c.settleId, pattern);
        or = orLike(or, all, types, ",siteId,", c.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(StSettleCloseDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, c.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.settleCloseId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleCloseId".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.settleCloseId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, c.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, c.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, c.settleCloseId));
        }
        return orders;
    }

    /* 정산 마감 수정 */
    @Override
    public int updateSelective(StSettleClose entity) {
        if (entity.getSettleCloseId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(c);
        boolean hasAny = false;

        if (entity.getSettleId()      != null) { update.set(c.settleId,      entity.getSettleId());      hasAny = true; }
        if (entity.getSiteId()        != null) { update.set(c.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getCloseStatusCd() != null) { update.set(c.closeStatusCd, entity.getCloseStatusCd()); hasAny = true; }
        if (entity.getCloseReason()   != null) { update.set(c.closeReason,   entity.getCloseReason());   hasAny = true; }
        if (entity.getFinalSettleAmt()!= null) { update.set(c.finalSettleAmt,entity.getFinalSettleAmt());hasAny = true; }
        if (entity.getCloseBy()       != null) { update.set(c.closeBy,       entity.getCloseBy());       hasAny = true; }
        if (entity.getCloseDate()     != null) { update.set(c.closeDate,     entity.getCloseDate());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(c.settleCloseId.eq(entity.getSettleCloseId())).execute();
        return (int) affected;
    }
}
