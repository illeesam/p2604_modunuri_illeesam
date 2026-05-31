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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyCodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyCode QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyCodeRepositoryImpl implements QSyCodeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyCodeRepositoryImpl";
    private static final QSyCode a = QSyCode.syCode;
    private static final QSySite ste = QSySite.sySite;

    /* baseSelColumnQuery */
    private JPAQuery<SyCodeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyCodeDto.Item.class,
                        a.codeId, a.siteId, a.codeGrp, a.codeValue, a.codeLabel,
                        a.sortOrd, a.useYn, a.parentCodeValue, a.childCodeValues,
                        a.codeRemark, a.codeLevel, a.codeOpt1,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId));
    }

    /* 키조회 */
    @Override
    public Optional<SyCodeDto.Item> selectById(String codeId) {
        SyCodeDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(a.codeId.eq(codeId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 목록조회 */
    @Override
    public List<SyCodeDto.Item> selectList(SyCodeDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyCodeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndCodeId(search),
                baseAndCodeGrp(search),
                baseAndCodeValue(search),
                baseAndParentCodeValue(search),
                baseAndUseYn(search),
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

    /* 페이지조회 */
    @Override
    public SyCodeDto.PageResponse selectPageList(SyCodeDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyCodeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                baseAndSiteId(search),
                baseAndCodeId(search),
                baseAndCodeGrp(search),
                baseAndCodeValue(search),
                baseAndParentCodeValue(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyCodeDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                baseAndSiteId(search),
                baseAndCodeId(search),
                baseAndCodeGrp(search),
                baseAndCodeValue(search),
                baseAndParentCodeValue(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyCodeDto.PageResponse res = new SyCodeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyCodeDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* codeId 정확 일치 */
    private BooleanExpression baseAndCodeId(SyCodeDto.Request search) {
        return search != null && StringUtils.hasText(search.getCodeId())
                ? a.codeId.eq(search.getCodeId()) : null;
    }

    /* codeGrp 정확 일치 */
    private BooleanExpression baseAndCodeGrp(SyCodeDto.Request search) {
        return search != null && StringUtils.hasText(search.getCodeGrp())
                ? a.codeGrp.eq(search.getCodeGrp()) : null;
    }

    /* codeValue 정확 일치 */
    private BooleanExpression baseAndCodeValue(SyCodeDto.Request search) {
        return search != null && StringUtils.hasText(search.getCodeValue())
                ? a.codeValue.eq(search.getCodeValue()) : null;
    }

    /* parentCodeValue 정확 일치 */
    private BooleanExpression baseAndParentCodeValue(SyCodeDto.Request search) {
        return search != null && StringUtils.hasText(search.getParentCodeValue())
                ? a.parentCodeValue.eq(search.getParentCodeValue()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(SyCodeDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? a.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyCodeDto.Request search) {
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
    private BooleanExpression baseAndSearchValue(SyCodeDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",childCodeValues,", a.childCodeValues, pattern);
        or = orLike(or, all, types, ",codeGrp,", a.codeGrp, pattern);
        or = orLike(or, all, types, ",codeId,", a.codeId, pattern);
        or = orLike(or, all, types, ",codeLabel,", a.codeLabel, pattern);
        or = orLike(or, all, types, ",codeOpt1,", a.codeOpt1, pattern);
        or = orLike(or, all, types, ",codeRemark,", a.codeRemark, pattern);
        or = orLike(or, all, types, ",codeValue,", a.codeValue, pattern);
        or = orLike(or, all, types, ",parentCodeValue,", a.parentCodeValue, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", a.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyCodeDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, a.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.codeId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("codeId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.codeId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, a.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, a.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.codeId));
        }
        return orders;
    }

    /* 수정 */
    @Override
    public int updateSelective(SyCode entity) {
        if (entity.getCodeId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(a.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getCodeGrp()         != null) { update.set(a.codeGrp,         entity.getCodeGrp());         hasAny = true; }
        if (entity.getCodeValue()       != null) { update.set(a.codeValue,       entity.getCodeValue());       hasAny = true; }
        if (entity.getCodeLabel()       != null) { update.set(a.codeLabel,       entity.getCodeLabel());       hasAny = true; }
        if (entity.getSortOrd()         != null) { update.set(a.sortOrd,         entity.getSortOrd());         hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(a.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getParentCodeValue() != null) { update.set(a.parentCodeValue, entity.getParentCodeValue()); hasAny = true; }
        if (entity.getChildCodeValues() != null) { update.set(a.childCodeValues, entity.getChildCodeValues()); hasAny = true; }
        if (entity.getCodeRemark()      != null) { update.set(a.codeRemark,      entity.getCodeRemark());      hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(a.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.codeId.eq(entity.getCodeId())).execute();
        return (int) affected;
    }
}
