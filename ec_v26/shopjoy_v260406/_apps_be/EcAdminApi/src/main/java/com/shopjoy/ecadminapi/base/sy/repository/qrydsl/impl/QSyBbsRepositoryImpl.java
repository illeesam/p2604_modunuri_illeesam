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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBbs;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBbs;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBbsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyBbs QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBbsRepositoryImpl implements QSyBbsRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyBbsRepositoryImpl";
    private static final QSyBbs syBbs = QSyBbs.syBbs;
    private static final QSySite sySite = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 게시판 게시물 baseSelColumnQuery */
    private JPAQuery<SyBbsDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyBbsDto.Item.class,
                        syBbs.bbsId, syBbs.siteId, syBbs.bbmId, syBbs.parentBbsId, syBbs.memberId, syBbs.authorNm,
                        syBbs.bbsTitle, syBbs.contentHtml, syBbs.attachGrpId, syBbs.viewCount, syBbs.likeCount,
                        syBbs.commentCount, syBbs.isFixed, syBbs.bbsStatusCd, syBbs.pathId,
                        syBbs.regBy, syBbs.regDate, syBbs.updBy, syBbs.updDate,
                        sySite.siteNm.as("siteNm")
                ))
                .from(syBbs)
                .leftJoin(sySite).on(sySite.siteId.eq(syBbs.siteId));
    }

    /* 게시판 게시물 키조회 */
    @Override
    public Optional<SyBbsDto.Item> selectById(String bbsId) {
        SyBbsDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syBbs.bbsId.eq(bbsId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 게시판 게시물 목록조회 */
    @Override
    public List<SyBbsDto.Item> selectList(SyBbsDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyBbsDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndBbsId(search),
                    baseAndStatus(search),
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

    /* 게시판 게시물 페이지조회 */
    @Override
    public SyBbsDto.PageResponse selectPageData(SyBbsDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndBbsId(search),
                baseAndStatus(search),
                baseAndSearchValue(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyBbsDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyBbsDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syBbs.count())
                .where(wheres)
                .fetchOne();

        SyBbsDto.PageResponse res = new SyBbsDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyBbsDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? syBbs.siteId.eq(search.getSiteId()) : null;
    }

    /* bbsId 정확 일치 */
    private BooleanExpression baseAndBbsId(SyBbsDto.Request search) {
        return search != null && StringUtils.hasText(search.getBbsId())
                ? syBbs.bbsId.eq(search.getBbsId()) : null;
    }

    /* bbsStatusCd 정확 일치 */
    private BooleanExpression baseAndStatus(SyBbsDto.Request search) {
        return search != null && StringUtils.hasText(search.getStatus())
                ? syBbs.bbsStatusCd.eq(search.getStatus()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyBbsDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",attachGrpId,", syBbs.attachGrpId, pattern);
        or = orLike(or, all, types, ",authorNm,", syBbs.authorNm, pattern);
        or = orLike(or, all, types, ",bbmId,", syBbs.bbmId, pattern);
        or = orLike(or, all, types, ",bbsId,", syBbs.bbsId, pattern);
        or = orLike(or, all, types, ",bbsStatusCd,", syBbs.bbsStatusCd, pattern);
        or = orLike(or, all, types, ",bbsTitle,", syBbs.bbsTitle, pattern);
        or = orLike(or, all, types, ",contentHtml,", syBbs.contentHtml, pattern);
        or = orLike(or, all, types, ",isFixed,", syBbs.isFixed, pattern);
        or = orLike(or, all, types, ",memberId,", syBbs.memberId, pattern);
        or = orLike(or, all, types, ",parentBbsId,", syBbs.parentBbsId, pattern);
        or = orLike(or, all, types, ",pathId,", syBbs.pathId, pattern);
        or = orLike(or, all, types, ",siteId,", syBbs.siteId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyBbsDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syBbs.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syBbs.bbsId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("bbsId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syBbs.bbsId));
                } else if ("authorNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, syBbs.authorNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syBbs.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syBbs.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syBbs.bbsId));
        }
        return orders;
    }

    /* 게시판 게시물 수정 */


    @Override
    public int updateSelective(SyBbs entity) {
        if (entity.getBbsId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syBbs);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(syBbs.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getBbmId()        != null) { update.set(syBbs.bbmId,        entity.getBbmId());        hasAny = true; }
        if (entity.getParentBbsId()  != null) { update.set(syBbs.parentBbsId,  entity.getParentBbsId());  hasAny = true; }
        if (entity.getMemberId()     != null) { update.set(syBbs.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getAuthorNm()     != null) { update.set(syBbs.authorNm,     entity.getAuthorNm());     hasAny = true; }
        if (entity.getBbsTitle()     != null) { update.set(syBbs.bbsTitle,     entity.getBbsTitle());     hasAny = true; }
        if (entity.getContentHtml()  != null) { update.set(syBbs.contentHtml,  entity.getContentHtml());  hasAny = true; }
        if (entity.getAttachGrpId()  != null) { update.set(syBbs.attachGrpId,  entity.getAttachGrpId());  hasAny = true; }
        if (entity.getViewCount()    != null) { update.set(syBbs.viewCount,    entity.getViewCount());    hasAny = true; }
        if (entity.getLikeCount()    != null) { update.set(syBbs.likeCount,    entity.getLikeCount());    hasAny = true; }
        if (entity.getCommentCount() != null) { update.set(syBbs.commentCount, entity.getCommentCount()); hasAny = true; }
        if (entity.getIsFixed()      != null) { update.set(syBbs.isFixed,      entity.getIsFixed());      hasAny = true; }
        if (entity.getBbsStatusCd()  != null) { update.set(syBbs.bbsStatusCd,  entity.getBbsStatusCd());  hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syBbs.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syBbs.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (entity.getPathId()       != null) { update.set(syBbs.pathId,       entity.getPathId());       hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(syBbs.bbsId.eq(entity.getBbsId())).execute();
        return (int) affected;
    }
}
