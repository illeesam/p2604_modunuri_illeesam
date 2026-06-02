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
    private static final QCmBlogFile cmBlogFile = QCmBlogFile.cmBlogFile;

    /* 게시물 첨부파일 baseSelColumnQuery */
    private JPAQuery<CmBlogFileDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmBlogFileDto.Item.class,
                        cmBlogFile.blogImgId, cmBlogFile.blogId, cmBlogFile.imgUrl, cmBlogFile.thumbUrl,
                        cmBlogFile.imgAltText, cmBlogFile.sortOrd,
                        cmBlogFile.regBy, cmBlogFile.regDate
                ))
                .from(cmBlogFile);
    }

    /* 게시물 첨부파일 키조회 */
    @Override
    public Optional<CmBlogFileDto.Item> selectById(String blogImgId) {
        CmBlogFileDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmBlogFile.blogImgId.eq(blogImgId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 게시물 첨부파일 목록조회 */
    @Override
    public List<CmBlogFileDto.Item> selectList(CmBlogFileDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmBlogFileDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndBlogIds(search),
                baseAndBlogId(search),
                baseAndBlogImgId(search),
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

    /* 게시물 첨부파일 페이지조회 */
    @Override
    public CmBlogFileDto.PageResponse selectPageData(CmBlogFileDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmBlogFileDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(
                baseAndBlogIds(search),
                baseAndBlogId(search),
                baseAndBlogImgId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmBlogFileDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(cmBlogFile.count())
                .from(cmBlogFile)
                .where(
                baseAndBlogIds(search),
                baseAndBlogId(search),
                baseAndBlogImgId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
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
    private BooleanExpression baseAndBlogIds(CmBlogFileDto.Request search) {
        return search != null && !CollectionUtils.isEmpty(search.getBlogIds())
                ? cmBlogFile.blogId.in(search.getBlogIds()) : null;
    }

    /* blogId 정확 일치 */
    private BooleanExpression baseAndBlogId(CmBlogFileDto.Request search) {
        return search != null && StringUtils.hasText(search.getBlogId())
                ? cmBlogFile.blogId.eq(search.getBlogId()) : null;
    }

    /* blogImgId 정확 일치 */
    private BooleanExpression baseAndBlogImgId(CmBlogFileDto.Request search) {
        return search != null && StringUtils.hasText(search.getBlogImgId())
                ? cmBlogFile.blogImgId.eq(search.getBlogImgId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(CmBlogFileDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return cmBlogFile.regDate.goe(start).and(cmBlogFile.regDate.lt(endExcl));
            case "upd_date": return cmBlogFile.updDate.goe(start).and(cmBlogFile.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(CmBlogFileDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",blogId,", cmBlogFile.blogId, pattern);
        or = orLike(or, all, types, ",blogImgId,", cmBlogFile.blogImgId, pattern);
        or = orLike(or, all, types, ",imgAltText,", cmBlogFile.imgAltText, pattern);
        or = orLike(or, all, types, ",imgUrl,", cmBlogFile.imgUrl, pattern);
        or = orLike(or, all, types, ",siteId,", cmBlogFile.siteId, pattern);
        or = orLike(or, all, types, ",thumbUrl,", cmBlogFile.thumbUrl, pattern);
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
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogFile.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogFile.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogFile.blogImgId));

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
                    orders.add(new OrderSpecifier(order, cmBlogFile.blogImgId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmBlogFile.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, cmBlogFile.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogFile.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogFile.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmBlogFile.blogImgId));
        }
        return orders;
    }

    /* 게시물 첨부파일 수정 */
    @Override
    public int updateSelective(CmBlogFile entity) {
        if (entity.getBlogImgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmBlogFile);
        boolean hasAny = false;

        if (entity.getBlogId()     != null) { update.set(cmBlogFile.blogId,     entity.getBlogId());     hasAny = true; }
        if (entity.getImgUrl()     != null) { update.set(cmBlogFile.imgUrl,     entity.getImgUrl());     hasAny = true; }
        if (entity.getThumbUrl()   != null) { update.set(cmBlogFile.thumbUrl,   entity.getThumbUrl());   hasAny = true; }
        if (entity.getImgAltText() != null) { update.set(cmBlogFile.imgAltText, entity.getImgAltText()); hasAny = true; }
        if (entity.getSortOrd()    != null) { update.set(cmBlogFile.sortOrd,    entity.getSortOrd());    hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(cmBlogFile.blogImgId.eq(entity.getBlogImgId())).execute();
        return (int) affected;
    }
}
