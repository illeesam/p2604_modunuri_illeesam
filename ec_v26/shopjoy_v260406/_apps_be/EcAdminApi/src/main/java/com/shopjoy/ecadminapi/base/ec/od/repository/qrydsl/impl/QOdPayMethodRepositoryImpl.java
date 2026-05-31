package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdPayMethodDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdPayMethod;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdPayMethodRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** OdPayMethod QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdPayMethodRepositoryImpl implements QOdPayMethodRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdPayMethodRepositoryImpl";
    private static final QOdPayMethod a   = QOdPayMethod.odPayMethod;
    private static final QMbMember    mem = new QMbMember("mem");
    private static final QSyCode      cdPm = new QSyCode("cd_pm");

    /* 결제수단 키조회 */
    @Override
    public Optional<OdPayMethodDto.Item> selectById(String payMethodId) {
        OdPayMethodDto.Item dto = baseListQuery()
                .where(a.payMethodId.eq(payMethodId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 결제수단 목록조회 */
    @Override
    public List<OdPayMethodDto.Item> selectList(OdPayMethodDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdPayMethodDto.Item> query = baseListQuery().where(
                baseAndPayMethodId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
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

    /* 결제수단 페이지조회 */
    @Override
    public OdPayMethodDto.PageResponse selectPageList(OdPayMethodDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdPayMethodDto.Item> query = baseListQuery().where(
                baseAndPayMethodId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<OdPayMethodDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndPayMethodId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        OdPayMethodDto.PageResponse res = new OdPayMethodDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 목록/페이지/단건 공용 base query (DTO Item에 별칭 컬럼 없음 - 기본 필드만 매핑) */
    private JPAQuery<OdPayMethodDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdPayMethodDto.Item.class,
                        a.payMethodId, a.memberId, a.payMethodTypeCd, a.payMethodNm,
                        a.payMethodAlias, a.payKeyNo, a.mainMethodYn,
                        a.regBy, a.regDate, a.updBy, a.updDate
                ))
                .from(a)
                .leftJoin(mem).on(mem.memberId.eq(a.memberId))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(a.payMethodTypeCd)));
    }

    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* payMethodId 정확 일치 */
    private BooleanExpression baseAndPayMethodId(OdPayMethodDto.Request search) {
        return search != null && StringUtils.hasText(search.getPayMethodId())
                ? a.payMethodId.eq(search.getPayMethodId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(OdPayMethodDto.Request search) {
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
    private BooleanExpression baseAndSearchValue(OdPayMethodDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",mainMethodYn,", a.mainMethodYn, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",payKeyNo,", a.payKeyNo, pattern);
        or = orLike(or, all, types, ",payMethodAlias,", a.payMethodAlias, pattern);
        or = orLike(or, all, types, ",payMethodId,", a.payMethodId, pattern);
        or = orLike(or, all, types, ",payMethodNm,", a.payMethodNm, pattern);
        or = orLike(or, all, types, ",payMethodTypeCd,", a.payMethodTypeCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(OdPayMethodDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.payMethodId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("payMethodId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.payMethodId));
                } else if ("payMethodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.payMethodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.payMethodId));
        }
        return orders;
    }

    /* 결제수단 수정 */
    @Override
    public int updateSelective(OdPayMethod entity) {
        if (entity.getPayMethodId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getMemberId()        != null) { update.set(a.memberId,        entity.getMemberId());        hasAny = true; }
        if (entity.getPayMethodTypeCd() != null) { update.set(a.payMethodTypeCd, entity.getPayMethodTypeCd()); hasAny = true; }
        if (entity.getPayMethodNm()     != null) { update.set(a.payMethodNm,     entity.getPayMethodNm());     hasAny = true; }
        if (entity.getPayMethodAlias()  != null) { update.set(a.payMethodAlias,  entity.getPayMethodAlias());  hasAny = true; }
        if (entity.getPayKeyNo()        != null) { update.set(a.payKeyNo,        entity.getPayKeyNo());        hasAny = true; }
        if (entity.getMainMethodYn()    != null) { update.set(a.mainMethodYn,    entity.getMainMethodYn());    hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(a.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.payMethodId.eq(entity.getPayMethodId())).execute();
        return (int) affected;
    }
}
