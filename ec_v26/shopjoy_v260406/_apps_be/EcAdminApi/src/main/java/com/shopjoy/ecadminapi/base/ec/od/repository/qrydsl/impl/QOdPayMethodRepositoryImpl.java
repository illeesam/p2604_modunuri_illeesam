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
    private static final QOdPayMethod odPayMethod   = QOdPayMethod.odPayMethod;
    private static final QMbMember    mem = new QMbMember("mem");
    private static final QSyCode      cdPm = new QSyCode("cd_pm");

    /** 목록/페이지/단건 공용 base query (DTO Item에 별칭 컬럼 없음 - 기본 필드만 매핑) */
    private JPAQuery<OdPayMethodDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(OdPayMethodDto.Item.class,
                        odPayMethod.payMethodId, odPayMethod.memberId, odPayMethod.payMethodTypeCd, odPayMethod.payMethodNm,
                        odPayMethod.payMethodAlias, odPayMethod.payKeyNo, odPayMethod.mainMethodYn,
                        odPayMethod.regBy, odPayMethod.regDate, odPayMethod.updBy, odPayMethod.updDate
                ))
                .from(odPayMethod)
                .leftJoin(mem).on(mem.memberId.eq(odPayMethod.memberId))
                .leftJoin(cdPm).on(cdPm.codeGrp.eq("PAY_METHOD").and(cdPm.codeValue.eq(odPayMethod.payMethodTypeCd)));
    }

    /* 결제수단 키조회 */
    @Override
    public Optional<OdPayMethodDto.Item> selectById(String payMethodId) {
        OdPayMethodDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odPayMethod.payMethodId.eq(payMethodId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 결제수단 목록조회 */
    @Override
    public List<OdPayMethodDto.Item> selectList(OdPayMethodDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<OdPayMethodDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndPayMethodId(search),
                    baseAndDateRange(search),
                    baseAndSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 결제수단 페이지조회 */
    @Override
    public OdPayMethodDto.PageResponse selectPageData(OdPayMethodDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndPayMethodId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<OdPayMethodDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<OdPayMethodDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odPayMethod.count())
                .where(wheres)
                .fetchOne();

        OdPayMethodDto.PageResponse res = new OdPayMethodDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
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
                ? odPayMethod.payMethodId.eq(search.getPayMethodId()) : null;
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
            case "reg_date": return odPayMethod.regDate.goe(start).and(odPayMethod.regDate.lt(endExcl));
            case "upd_date": return odPayMethod.updDate.goe(start).and(odPayMethod.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",mainMethodYn,", odPayMethod.mainMethodYn, pattern);
        or = orLike(or, all, types, ",memberId,", odPayMethod.memberId, pattern);
        or = orLike(or, all, types, ",payKeyNo,", odPayMethod.payKeyNo, pattern);
        or = orLike(or, all, types, ",payMethodAlias,", odPayMethod.payMethodAlias, pattern);
        or = orLike(or, all, types, ",payMethodId,", odPayMethod.payMethodId, pattern);
        or = orLike(or, all, types, ",payMethodNm,", odPayMethod.payMethodNm, pattern);
        or = orLike(or, all, types, ",payMethodTypeCd,", odPayMethod.payMethodTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", odPayMethod.siteId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, odPayMethod.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odPayMethod.payMethodId));
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
                    orders.add(new OrderSpecifier(order, odPayMethod.payMethodId));
                } else if ("payMethodNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, odPayMethod.payMethodNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, odPayMethod.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, odPayMethod.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, odPayMethod.payMethodId));
        }
        return orders;
    }

    /* 결제수단 수정 */
    @Override
    public int updateSelective(OdPayMethod entity) {
        if (entity.getPayMethodId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odPayMethod);
        boolean hasAny = false;

        if (entity.getMemberId()        != null) { update.set(odPayMethod.memberId,        entity.getMemberId());        hasAny = true; }
        if (entity.getPayMethodTypeCd() != null) { update.set(odPayMethod.payMethodTypeCd, entity.getPayMethodTypeCd()); hasAny = true; }
        if (entity.getPayMethodNm()     != null) { update.set(odPayMethod.payMethodNm,     entity.getPayMethodNm());     hasAny = true; }
        if (entity.getPayMethodAlias()  != null) { update.set(odPayMethod.payMethodAlias,  entity.getPayMethodAlias());  hasAny = true; }
        if (entity.getPayKeyNo()        != null) { update.set(odPayMethod.payKeyNo,        entity.getPayKeyNo());        hasAny = true; }
        if (entity.getMainMethodYn()    != null) { update.set(odPayMethod.mainMethodYn,    entity.getMainMethodYn());    hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(odPayMethod.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(odPayMethod.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odPayMethod.payMethodId.eq(entity.getPayMethodId())).execute();
        return (int) affected;
    }
}
