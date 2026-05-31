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
import com.shopjoy.ecadminapi.base.sy.repository.SyPathRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCodeGrp;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyCodeGrpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyCodeGrp QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyCodeGrpRepositoryImpl implements QSyCodeGrpRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private static final QSyCodeGrp g = QSyCodeGrp.syCodeGrp;
    private static final QSySite ste = QSySite.sySite;

    /* 공통 코드 그룹 buildBaseQuery */
    private JPAQuery<SyCodeGrpDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyCodeGrpDto.Item.class,
                        g.codeGrpId, g.siteId, g.codeGrp, g.grpNm, g.pathId,
                        g.codeGrpDesc, g.useYn,
                        g.regBy, g.regDate, g.updBy, g.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(g)
                .leftJoin(ste).on(ste.siteId.eq(g.siteId));
    }

    /* 공통 코드 그룹 키조회 */
    @Override
    public Optional<SyCodeGrpDto.Item> selectById(String codeGrpId) {
        SyCodeGrpDto.Item dto = buildBaseQuery()
                .where(g.codeGrpId.eq(codeGrpId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 공통 코드 그룹 목록조회 */
    @Override
    public List<SyCodeGrpDto.Item> selectList(SyCodeGrpDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyCodeGrpDto.Item> query = buildBaseQuery().where(
                andSiteId(search),
                andPathId(search),
                andCodeGrpId(search),
                andCodeGrp(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
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

    /* 공통 코드 그룹 페이지조회 */
    @Override
    public SyCodeGrpDto.PageResponse selectPageList(SyCodeGrpDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyCodeGrpDto.Item> query = buildBaseQuery().where(
                andSiteId(search),
                andPathId(search),
                andCodeGrpId(search),
                andCodeGrp(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyCodeGrpDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(g.count()).from(g).where(
                andSiteId(search),
                andPathId(search),
                andCodeGrpId(search),
                andCodeGrp(search),
                andUseYn(search),
                andDateRange(search),
                andSearchValue(search)
        ).fetchOne();

        SyCodeGrpDto.PageResponse res = new SyCodeGrpDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyCodeGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? g.siteId.eq(search.getSiteId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로 포함 */
    private BooleanExpression andPathId(SyCodeGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? g.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_code_grp"))
                : null;
    }

    /* codeGrpId 정확 일치 */
    private BooleanExpression andCodeGrpId(SyCodeGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getCodeGrpId())
                ? g.codeGrpId.eq(search.getCodeGrpId()) : null;
    }

    /* codeGrp 정확 일치 */
    private BooleanExpression andCodeGrp(SyCodeGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getCodeGrp())
                ? g.codeGrp.eq(search.getCodeGrp()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression andUseYn(SyCodeGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? g.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(SyCodeGrpDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return g.regDate.goe(start).and(g.regDate.lt(endExcl));
            case "upd_date": return g.updDate.goe(start).and(g.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyCodeGrpDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",codeGrp,", g.codeGrp, pattern);
        or = orLike(or, all, types, ",codeGrpDesc,", g.codeGrpDesc, pattern);
        or = orLike(or, all, types, ",codeGrpId,", g.codeGrpId, pattern);
        or = orLike(or, all, types, ",grpNm,", g.grpNm, pattern);
        or = orLike(or, all, types, ",pathId,", g.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", g.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", g.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyCodeGrpDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, g.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, g.codeGrpId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("codeGrpId".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.codeGrpId));
                } else if ("grpNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.grpNm));
                } else if ("codeGrp".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.codeGrp));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, g.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, g.codeGrpId));
        }
        return orders;
    }

    /* 공통 코드 그룹 수정 */
    @Override
    public int updateSelective(SyCodeGrp entity) {
        if (entity.getCodeGrpId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(g);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(g.siteId,      entity.getSiteId());      hasAny = true; }
        if (entity.getCodeGrp()     != null) { update.set(g.codeGrp,     entity.getCodeGrp());     hasAny = true; }
        if (entity.getGrpNm()       != null) { update.set(g.grpNm,       entity.getGrpNm());       hasAny = true; }
        if (entity.getPathId()      != null) { update.set(g.pathId,      entity.getPathId());      hasAny = true; }
        if (entity.getCodeGrpDesc() != null) { update.set(g.codeGrpDesc, entity.getCodeGrpDesc()); hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(g.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(g.updBy,       entity.getUpdBy());       hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(g.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(g.codeGrpId.eq(entity.getCodeGrpId())).execute();
        return (int) affected;
    }
}
