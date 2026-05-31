package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogFileDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmBlogFile;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmBlogFileRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;
import org.springframework.util.CollectionUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** CmBlogFile QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmBlogFileRepositoryImpl implements QCmBlogFileRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmBlogFileRepositoryImpl";
    private static final QCmBlogFile f = QCmBlogFile.cmBlogFile;

    /* 게시물 첨부파일 buildBaseQuery */
    private JPAQuery<CmBlogFileDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogFileDto.Item.class,
                        f.blogImgId, f.blogId, f.imgUrl, f.thumbUrl,
                        f.imgAltText, f.sortOrd,
                        f.regBy, f.regDate
                ))
                .from(f);
    }

    /* 게시물 첨부파일 키조회 */
    @Override
    public Optional<CmBlogFileDto.Item> selectById(String blogImgId) {
        CmBlogFileDto.Item dto = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(f.blogImgId.eq(blogImgId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 게시물 첨부파일 목록조회 */
    @Override
    public List<CmBlogFileDto.Item> selectList(CmBlogFileDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogFileDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                andBlogIds(search),
                andBlogId(search),
                andBlogImgId(search),
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

    /* 게시물 첨부파일 페이지조회 */
    @Override
    public CmBlogFileDto.PageResponse selectPageList(CmBlogFileDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmBlogFileDto.Item> query = buildBaseQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                andBlogIds(search),
                andBlogId(search),
                andBlogImgId(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogFileDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(f.count())
                .from(f)
                .where(
                andBlogIds(search),
                andBlogId(search),
                andBlogImgId(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        CmBlogFileDto.PageResponse res = new CmBlogFileDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 게시물 첨부파일 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* blogId IN */
    private BooleanExpression andBlogIds(CmBlogFileDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getBlogIds())
                ? f.blogId.in(search.getBlogIds()) : null;
    }

    /* blogId 정확 일치 */
    private BooleanExpression andBlogId(CmBlogFileDto.Request search) {
        return search != null && StringUtils.hasText(search.getBlogId())
                ? f.blogId.eq(search.getBlogId()) : null;
    }

    /* blogImgId 정확 일치 */
    private BooleanExpression andBlogImgId(CmBlogFileDto.Request search) {
        return search != null && StringUtils.hasText(search.getBlogImgId())
                ? f.blogImgId.eq(search.getBlogImgId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(CmBlogFileDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return f.regDate.goe(start).and(f.regDate.lt(endExcl));
            case "upd_date": return f.updDate.goe(start).and(f.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(CmBlogFileDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",blogId,", f.blogId, pattern);
        or = orLike(or, all, types, ",blogImgId,", f.blogImgId, pattern);
        or = orLike(or, all, types, ",imgAltText,", f.imgAltText, pattern);
        or = orLike(or, all, types, ",imgUrl,", f.imgUrl, pattern);
        or = orLike(or, all, types, ",siteId,", f.siteId, pattern);
        or = orLike(or, all, types, ",thumbUrl,", f.thumbUrl, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(CmBlogFileDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, f.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, f.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, f.blogImgId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("blogImgId".equals(field)) {
                    orders.add(new OrderSpecifier(order, f.blogImgId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, f.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, f.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, f.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, f.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, f.blogImgId));
        }
        return orders;
    }

    /* 게시물 첨부파일 수정 */
    @Override
    public int updateSelective(CmBlogFile entity) {
        if (entity.getBlogImgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(f);
        boolean hasAny = false;

        if (entity.getBlogId()     != null) { update.set(f.blogId,     entity.getBlogId());     hasAny = true; }
        if (entity.getImgUrl()     != null) { update.set(f.imgUrl,     entity.getImgUrl());     hasAny = true; }
        if (entity.getThumbUrl()   != null) { update.set(f.thumbUrl,   entity.getThumbUrl());   hasAny = true; }
        if (entity.getImgAltText() != null) { update.set(f.imgAltText, entity.getImgAltText()); hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(f.sortOrd,    entity.getSortOrd());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(f.blogImgId.eq(entity.getBlogImgId())).execute();
        return (int) affected;
    }
}
