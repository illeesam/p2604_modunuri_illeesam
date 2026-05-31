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
import com.shopjoy.ecadminapi.base.sy.repository.SyDeptRepository;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyDept;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyDeptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Lazy;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyDept QueryDSL Custom 구현체 */
public class QSyDeptRepositoryImpl implements QSyDeptRepository {

    private final JPAQueryFactory queryFactory;
    private final SyDeptRepository syDeptRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyDeptRepositoryImpl";
    private static final QSyDept a = QSyDept.syDept;

    public QSyDeptRepositoryImpl(JPAQueryFactory queryFactory, @Lazy SyDeptRepository syDeptRepository) {
        this.queryFactory = queryFactory;
        this.syDeptRepository = syDeptRepository;
    }
    private static final QSySite ste = QSySite.sySite;
    private static final QSyUser usr = QSyUser.syUser;
    private static final QSyCode cdDt = new QSyCode("cd_dt");

    /* 부서 baseSelColumnQuery */
    private JPAQuery<SyDeptDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyDeptDto.Item.class,
                        a.deptId, a.siteId, a.deptCode, a.deptNm, a.parentDeptId,
                        a.deptTypeCd, a.managerId, a.sortOrd, a.useYn, a.deptRemark,
                        a.regBy, a.regDate, a.updBy, a.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(usr).on(usr.userId.eq(a.managerId))
                .leftJoin(cdDt).on(cdDt.codeGrp.eq("DEPT_TYPE").and(cdDt.codeValue.eq(a.deptTypeCd)));
    }

    /* 부서 키조회 */
    @Override
    public Optional<SyDeptDto.Item> selectById(String deptId) {
        SyDeptDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(a.deptId.eq(deptId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 부서 목록조회 */
    @Override
    public List<SyDeptDto.Item> selectList(SyDeptDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyDeptDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndParentDeptId(search),
                baseAndTypeCd(search),
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

    /* 부서 페이지조회 */
    @Override
    public SyDeptDto.PageResponse selectPageList(SyDeptDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyDeptDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                baseAndSiteId(search),
                baseAndParentDeptId(search),
                baseAndTypeCd(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyDeptDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(a.count()).from(a).where(
                baseAndSiteId(search),
                baseAndParentDeptId(search),
                baseAndTypeCd(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyDeptDto.PageResponse res = new SyDeptDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyDeptDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* 부서 트리 — 선택 노드 + 모든 자손 부서 포함 (자기참조 재귀 CTE) */
    private BooleanExpression baseAndParentDeptId(SyDeptDto.Request search) {
        return search != null && StringUtils.hasText(search.getParentDeptId())
                ? a.deptId.in(syDeptRepository.findTreeDeptIds(search.getParentDeptId()))
                : null;
    }

    /* deptTypeCd 정확 일치 */
    private BooleanExpression baseAndTypeCd(SyDeptDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? a.deptTypeCd.eq(search.getTypeCd()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(SyDeptDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? a.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyDeptDto.Request search) {
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
    private BooleanExpression baseAndSearchValue(SyDeptDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",deptCode,", a.deptCode, pattern);
        or = orLike(or, all, types, ",deptId,", a.deptId, pattern);
        or = orLike(or, all, types, ",deptNm,", a.deptNm, pattern);
        or = orLike(or, all, types, ",deptRemark,", a.deptRemark, pattern);
        or = orLike(or, all, types, ",deptTypeCd,", a.deptTypeCd, pattern);
        or = orLike(or, all, types, ",managerId,", a.managerId, pattern);
        or = orLike(or, all, types, ",parentDeptId,", a.parentDeptId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyDeptDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, a.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.deptId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("deptId".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.deptId));
                } else if ("deptNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.deptNm));
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
            orders.add(new OrderSpecifier<>(Order.ASC, a.deptId));
        }
        return orders;
    }

    /* 부서 수정 */
    @Override
    public int updateSelective(SyDept entity) {
        if (entity.getDeptId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(a.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getDeptCode()     != null) { update.set(a.deptCode,     entity.getDeptCode());     hasAny = true; }
        if (entity.getDeptNm()       != null) { update.set(a.deptNm,       entity.getDeptNm());       hasAny = true; }
        if (entity.getParentDeptId() != null) { update.set(a.parentDeptId, entity.getParentDeptId()); hasAny = true; }
        if (entity.getDeptTypeCd()   != null) { update.set(a.deptTypeCd,   entity.getDeptTypeCd());   hasAny = true; }
        if (entity.getManagerId()    != null) { update.set(a.managerId,    entity.getManagerId());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(a.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(a.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getDeptRemark()   != null) { update.set(a.deptRemark,   entity.getDeptRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(a.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.deptId.eq(entity.getDeptId())).execute();
        return (int) affected;
    }
}
