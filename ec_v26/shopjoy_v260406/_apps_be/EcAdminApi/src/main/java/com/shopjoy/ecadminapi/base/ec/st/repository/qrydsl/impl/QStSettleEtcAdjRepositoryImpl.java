package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleEtcAdjRepository;
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
/** StSettleEtcAdj QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleEtcAdjRepositoryImpl implements QStSettleEtcAdjRepository {

    private final JPAQueryFactory queryFactory;
    private static final QStSettleEtcAdj a     = QStSettleEtcAdj.stSettleEtcAdj;
    private static final QSySite         ste   = QSySite.sySite;
    private static final QSyCode         cdSeat = new QSyCode("cd_seat");
    private static final QSyCode         cdAd   = new QSyCode("cd_ad");

    /* 정산 기타 조정 키조회 */
    @Override
    public Optional<StSettleEtcAdjDto.Item> selectById(String id) {
        StSettleEtcAdjDto.Item dto = baseListQuery()
                .where(a.settleEtcAdjId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 기타 조정 목록조회 */
    @Override
    public List<StSettleEtcAdjDto.Item> selectList(StSettleEtcAdjDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleEtcAdjDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andSettleEtcAdjId(search),
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

    /* 정산 기타 조정 페이지조회 */
    @Override
    public StSettleEtcAdjDto.PageResponse selectPageList(StSettleEtcAdjDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleEtcAdjDto.Item> query = baseListQuery().where(
                andSiteId(search),
                andSettleEtcAdjId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<StSettleEtcAdjDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                andSiteId(search),
                andSettleEtcAdjId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        StSettleEtcAdjDto.PageResponse res = new StSettleEtcAdjDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 기타 조정 baseListQuery */
    private JPAQuery<StSettleEtcAdjDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleEtcAdjDto.Item.class,
                        a.settleEtcAdjId, a.settleId, a.siteId,
                        a.etcAdjTypeCd, a.etcAdjDirCd, a.etcAdjAmt,
                        a.etcAdjReason, a.settleEtcAdjMemo,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm"),
                        cdSeat.codeLabel.as("etcAdjTypeCdNm"),
                        cdAd.codeLabel.as("etcAdjDirCdNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(cdSeat).on(cdSeat.codeGrp.eq("SETTLE_ETC_ADJ_TYPE").and(cdSeat.codeValue.eq(a.etcAdjTypeCd)))
                .leftJoin(cdAd).on(cdAd.codeGrp.eq("ADJ_DIR").and(cdAd.codeValue.eq(a.etcAdjDirCd)));
    }

    /* 정산 기타 조정 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(StSettleEtcAdjDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* settleEtcAdjId 정확 일치 */
    private BooleanExpression andSettleEtcAdjId(StSettleEtcAdjDto.Request search) {
        return search != null && StringUtils.hasText(search.getSettleEtcAdjId())
                ? a.settleEtcAdjId.eq(search.getSettleEtcAdjId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(StSettleEtcAdjDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(StSettleEtcAdjDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",etcAdjDirCd,", a.etcAdjDirCd, pattern);
        or = orLike(or, all, types, ",etcAdjReason,", a.etcAdjReason, pattern);
        or = orLike(or, all, types, ",etcAdjTypeCd,", a.etcAdjTypeCd, pattern);
        or = orLike(or, all, types, ",settleEtcAdjId,", a.settleEtcAdjId, pattern);
        or = orLike(or, all, types, ",settleEtcAdjMemo,", a.settleEtcAdjMemo, pattern);
        or = orLike(or, all, types, ",settleId,", a.settleId, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(StSettleEtcAdjDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.settleEtcAdjId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleEtcAdjId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.settleEtcAdjId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.settleEtcAdjId));
        }
        return orders;
    }

    /* 정산 기타 조정 수정 */
    @Override
    public int updateSelective(StSettleEtcAdj entity) {
        if (entity.getSettleEtcAdjId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSettleId()         != null) { update.set(a.settleId,         entity.getSettleId());         hasAny = true; }
        if (entity.getSiteId()           != null) { update.set(a.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getEtcAdjTypeCd()     != null) { update.set(a.etcAdjTypeCd,     entity.getEtcAdjTypeCd());     hasAny = true; }
        if (entity.getEtcAdjDirCd()      != null) { update.set(a.etcAdjDirCd,      entity.getEtcAdjDirCd());      hasAny = true; }
        if (entity.getEtcAdjAmt()        != null) { update.set(a.etcAdjAmt,        entity.getEtcAdjAmt());        hasAny = true; }
        if (entity.getEtcAdjReason()     != null) { update.set(a.etcAdjReason,     entity.getEtcAdjReason());     hasAny = true; }
        if (entity.getSettleEtcAdjMemo() != null) { update.set(a.settleEtcAdjMemo, entity.getSettleEtcAdjMemo()); hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(a.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.settleEtcAdjId.eq(entity.getSettleEtcAdjId())).execute();
        return (int) affected;
    }
}
