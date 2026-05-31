package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdOptDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProdOpt;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdOptRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.CollectionUtils;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PdProdOpt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdProdOptRepositoryImpl implements QPdProdOptRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdProdOptRepositoryImpl";
    private static final QPdProdOpt a    = QPdProdOpt.pdProdOpt;
    private static final QSySite    ste  = QSySite.sySite;
    private static final QSyCode    cdOt  = new QSyCode("cd_ot");
    private static final QSyCode    cdOit = new QSyCode("cd_oit");

    private JPAQuery<PdProdOptDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdProdOptDto.Item.class,
                        a.optId,
                        a.siteId,
                        a.prodId,
                        a.optGrpNm,
                        a.optLevel,
                        a.optTypeCd,
                        a.optInputTypeCd,
                        a.sortOrd,
                        a.regBy,
                        a.regDate,
                        a.updBy,
                        a.updDate,
                        ste.siteNm.as("siteNm"),
                        cdOt.codeLabel.as("optTypeCdNm"),
                        cdOit.codeLabel.as("optInputTypeCdNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(cdOt).on(cdOt.codeGrp.eq("OPT_TYPE").and(cdOt.codeValue.eq(a.optTypeCd)))
                .leftJoin(cdOit).on(cdOit.codeGrp.eq("OPT_INPUT_TYPE").and(cdOit.codeValue.eq(a.optInputTypeCd)));
    }

    /* 상품 옵션 키조회 */
    @Override
    public Optional<PdProdOptDto.Item> selectById(String optId) {
        PdProdOptDto.Item dto = baseSelColumnQuery()
                .where(a.optId.eq(optId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 상품 옵션 목록조회 */
    @Override
    public List<PdProdOptDto.Item> selectList(PdProdOptDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptDto.Item> query = baseSelColumnQuery().where(
                baseAndProdIds(search),
                baseAndProdId(search),
                baseAndSiteId(search),
                baseAndOptId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
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

    /* 상품 옵션 페이지조회 */
    @Override
    public PdProdOptDto.PageResponse selectPageList(PdProdOptDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PdProdOptDto.Item> query = baseSelColumnQuery().where(
                baseAndProdIds(search),
                baseAndProdId(search),
                baseAndSiteId(search),
                baseAndOptId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PdProdOptDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                baseAndProdIds(search),
                baseAndProdId(search),
                baseAndSiteId(search),
                baseAndOptId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        PdProdOptDto.PageResponse res = new PdProdOptDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 단건/목록/페이지 공용 base query */
    /* searchType 사용 예  searchType = "<Entity 필드명 콤마구분>" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* prodId IN */
    private BooleanExpression baseAndProdIds(PdProdOptDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getProdIds())
                ? a.prodId.in(search.getProdIds()) : null;
    }

    /* prodId 정확 일치 */
    private BooleanExpression baseAndProdId(PdProdOptDto.Request search) {
        return search != null && StringUtils.hasText(search.getProdId())
                ? a.prodId.eq(search.getProdId()) : null;
    }

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PdProdOptDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* optId 정확 일치 */
    private BooleanExpression baseAndOptId(PdProdOptDto.Request search) {
        return search != null && StringUtils.hasText(search.getOptId())
                ? a.optId.eq(search.getOptId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PdProdOptDto.Request search) {
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
    private BooleanExpression baseAndSearchValue(PdProdOptDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",optGrpNm,", a.optGrpNm, pattern);
        or = orLike(or, all, types, ",optId,", a.optId, pattern);
        or = orLike(or, all, types, ",optInputTypeCd,", a.optInputTypeCd, pattern);
        or = orLike(or, all, types, ",optTypeCd,", a.optTypeCd, pattern);
        or = orLike(or, all, types, ",prodId,", a.prodId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PdProdOptDto.Request req) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = req == null ? null : req.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, a.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.optId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("optId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.optId));
                } else if ("optGrpNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.optGrpNm));
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
            orders.add(new OrderSpecifier<>(Order.ASC, a.optId));
        }
        return orders;
    }

    /* 상품 옵션 수정 */

    @Override
    public int updateSelective(PdProdOpt entity) {
        if (entity.getOptId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(a.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getProdId()         != null) { update.set(a.prodId,         entity.getProdId());         hasAny = true; }
        if (entity.getOptGrpNm()       != null) { update.set(a.optGrpNm,       entity.getOptGrpNm());       hasAny = true; }
        if (entity.getOptLevel()       != null) { update.set(a.optLevel,       entity.getOptLevel());       hasAny = true; }
        if (entity.getOptTypeCd()      != null) { update.set(a.optTypeCd,      entity.getOptTypeCd());      hasAny = true; }
        if (entity.getOptInputTypeCd() != null) { update.set(a.optInputTypeCd, entity.getOptInputTypeCd()); hasAny = true; }
        if (entity.getSortOrd()        != null) { update.set(a.sortOrd,        entity.getSortOrd());        hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(a.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.optId.eq(entity.getOptId())).execute();
        return (int) affected;
    }
}
