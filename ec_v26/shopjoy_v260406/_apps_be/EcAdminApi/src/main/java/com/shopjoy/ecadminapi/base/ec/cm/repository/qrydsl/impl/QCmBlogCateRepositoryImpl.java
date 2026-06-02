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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogCateDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogCate;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogCateRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** CmBlogCate QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogCateRepositoryImpl implements QCmBlogCateRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogCateRepositoryImpl";
    private static final QCmBlogCate cmBlogCate = QCmBlogCate.cmBlogCate;
    private static final QSySite sySite = QSySite.sySite;

    /* 게시판 카테고리 baseSelColumnQuery */
    private JPAQuery<CmBlogCateDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogCateDto.Item.class,
                        cmBlogCate.blogCateId, cmBlogCate.siteId, cmBlogCate.blogCateNm, cmBlogCate.parentBlogCateId,
                        cmBlogCate.sortOrd, cmBlogCate.useYn,
                        cmBlogCate.regBy, cmBlogCate.regDate, cmBlogCate.updBy, cmBlogCate.updDate,
                        sySite.siteNm.as("siteNm")
                ))
                .from(cmBlogCate)
                .leftJoin(sySite).on(sySite.siteId.eq(cmBlogCate.siteId));
    }

    /* 게시판 카테고리 키조회 */
    @Override
    public Optional<CmBlogCateDto.Item> selectById(String blogCateId) {
        CmBlogCateDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogCate.blogCateId.eq(blogCateId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 게시판 카테고리 목록조회 */
    @Override
    public List<CmBlogCateDto.Item> selectList(CmBlogCateDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogCateDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndBlogCateId(search),
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

    /* 게시판 카테고리 페이지조회 */
    @Override
    public CmBlogCateDto.PageResponse selectPageData(CmBlogCateDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndBlogCateId(search),
                baseAndUseYn(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<CmBlogCateDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogCateDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(cmBlogCate.count())
                .from(cmBlogCate)
                .where(wheres)
                .fetchOne();

        CmBlogCateDto.PageResponse res = new CmBlogCateDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(CmBlogCateDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? cmBlogCate.siteId.eq(search.getSiteId()) : null;
    }

    /* blogCateId 정확 일치 */
    private BooleanExpression baseAndBlogCateId(CmBlogCateDto.Request search) {
        return search != null && StringUtils.hasText(search.getBlogCateId())
                ? cmBlogCate.blogCateId.eq(search.getBlogCateId()) : null;
    }

    /* useYn 정확 일치 */
    private BooleanExpression baseAndUseYn(CmBlogCateDto.Request search) {
        return search != null && StringUtils.hasText(search.getUseYn())
                ? cmBlogCate.useYn.eq(search.getUseYn()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(CmBlogCateDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return cmBlogCate.regDate.goe(start).and(cmBlogCate.regDate.lt(endExcl));
            case "upd_date": return cmBlogCate.updDate.goe(start).and(cmBlogCate.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(CmBlogCateDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",blogCateId,", cmBlogCate.blogCateId, pattern);
        or = orLike(or, all, types, ",blogCateNm,", cmBlogCate.blogCateNm, pattern);
        or = orLike(or, all, types, ",parentBlogCateId,", cmBlogCate.parentBlogCateId, pattern);
        or = orLike(or, all, types, ",siteId,", cmBlogCate.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", cmBlogCate.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(CmBlogCateDto.Request sySite) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = sySite == null ? null : sySite.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.blogCateId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("blogCateId".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogCate.blogCateId));
                } else if ("blogCateNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogCate.blogCateNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogCate.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, cmBlogCate.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogCate.blogCateId));
        }
        return orders;
    }

    /* 게시판 카테고리 수정 */
    @Override
    public int updateSelective(CmBlogCate entity) {
        if (entity.getBlogCateId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogCate);
        boolean hasAny = false;

        if (entity.getSiteId()           != null) { update.set(cmBlogCate.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getBlogCateNm()       != null) { update.set(cmBlogCate.blogCateNm,       entity.getBlogCateNm());       hasAny = true; }
        if (entity.getParentBlogCateId() != null) { update.set(cmBlogCate.parentBlogCateId, entity.getParentBlogCateId()); hasAny = true; }
        if (entity.getSortOrd()          != null) { update.set(cmBlogCate.sortOrd,          entity.getSortOrd());          hasAny = true; }
        if (entity.getUseYn()            != null) { update.set(cmBlogCate.useYn,            entity.getUseYn());            hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(cmBlogCate.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(cmBlogCate.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmBlogCate.blogCateId.eq(entity.getBlogCateId())).execute();
        return (int) affected;
    }
}
