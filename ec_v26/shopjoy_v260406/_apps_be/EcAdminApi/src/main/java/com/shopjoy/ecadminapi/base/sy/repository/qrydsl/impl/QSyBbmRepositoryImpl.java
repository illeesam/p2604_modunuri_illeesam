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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBbm;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyBbm;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyBbmRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyBbm QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyBbmRepositoryImpl implements QSyBbmRepository {

    private final JPAQueryFactory queryFactory;
    private final SyPathRepository syPathRepository;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyBbmRepositoryImpl";
    private static final QSyBbm b = QSyBbm.syBbm;
    private static final QSySite ste = QSySite.sySite;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 게시판 마스터 키조회 */
    @Override
    public Optional<SyBbmDto.Item> selectById(String bbmId) {
        SyBbmDto.Item dto = baseQuery().where(b.bbmId.eq(bbmId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 게시판 마스터 목록조회 */
    @Override
    public List<SyBbmDto.Item> selectList(SyBbmDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyBbmDto.Item> query = baseQuery().where(
                andSiteId(search),
                andBbmId(search),
                andPathId(search),
                andTypeCd(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 게시판 마스터 페이지조회 */
    @Override
    public SyBbmDto.PageResponse selectPageList(SyBbmDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyBbmDto.Item> query = baseQuery().where(
                andSiteId(search),
                andBbmId(search),
                andPathId(search),
                andTypeCd(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyBbmDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(b.count()).from(b).where(
                andSiteId(search),
                andBbmId(search),
                andPathId(search),
                andTypeCd(search),
                andSearchValue(search)
        ).fetchOne();

        SyBbmDto.PageResponse res = new SyBbmDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 게시판 마스터 baseQuery */
    private JPAQuery<SyBbmDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyBbmDto.Item.class,
                        b.bbmId, b.siteId, b.bbmCode, b.bbmNm, b.pathId, b.bbmTypeCd,
                        b.allowComment, b.allowAttach, b.allowLike, b.contentTypeCd,
                        b.scopeTypeCd, b.sortOrd, b.useYn, b.bbmRemark,
                        b.regBy, b.regDate, b.updBy, b.updDate,
                        ste.siteNm.as("siteNm")
                ))
                .from(b)
                .leftJoin(ste).on(ste.siteId.eq(b.siteId));
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyBbmDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? b.siteId.eq(search.getSiteId()) : null;
    }

    /* bbmId 정확 일치 */
    private BooleanExpression andBbmId(SyBbmDto.Request search) {
        return search != null && StringUtils.hasText(search.getBbmId())
                ? b.bbmId.eq(search.getBbmId()) : null;
    }

    /* 표시경로 트리 — 선택 노드 + 모든 자손 경로의 게시판까지 포함 */
    private BooleanExpression andPathId(SyBbmDto.Request search) {
        return search != null && StringUtils.hasText(search.getPathId())
                ? b.pathId.in(syPathRepository.findTreePathIds(search.getPathId(), "sy_bbm"))
                : null;
    }

    /* bbmTypeCd 정확 일치 */
    private BooleanExpression andTypeCd(SyBbmDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? b.bbmTypeCd.eq(search.getTypeCd()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyBbmDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",allowAttach,", b.allowAttach, pattern);
        or = orLike(or, all, types, ",allowComment,", b.allowComment, pattern);
        or = orLike(or, all, types, ",allowLike,", b.allowLike, pattern);
        or = orLike(or, all, types, ",bbmCode,", b.bbmCode, pattern);
        or = orLike(or, all, types, ",bbmId,", b.bbmId, pattern);
        or = orLike(or, all, types, ",bbmNm,", b.bbmNm, pattern);
        or = orLike(or, all, types, ",bbmRemark,", b.bbmRemark, pattern);
        or = orLike(or, all, types, ",bbmTypeCd,", b.bbmTypeCd, pattern);
        or = orLike(or, all, types, ",contentTypeCd,", b.contentTypeCd, pattern);
        or = orLike(or, all, types, ",pathId,", b.pathId, pattern);
        or = orLike(or, all, types, ",scopeTypeCd,", b.scopeTypeCd, pattern);
        or = orLike(or, all, types, ",siteId,", b.siteId, pattern);
        or = orLike(or, all, types, ",useYn,", b.useYn, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyBbmDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, b.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, b.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, b.bbmId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("bbmId".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.bbmId));
                } else if ("bbmNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.bbmNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, b.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, b.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, b.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, b.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, b.bbmId));
        }
        return orders;
    }

    /* 게시판 마스터 수정 */
    @Override
    public int updateSelective(SyBbm entity) {
        if (entity.getBbmId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(b);
        boolean hasAny = false;

        if (entity.getSiteId()        != null) { update.set(b.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getBbmCode()       != null) { update.set(b.bbmCode,       entity.getBbmCode());       hasAny = true; }
        if (entity.getBbmNm()         != null) { update.set(b.bbmNm,         entity.getBbmNm());         hasAny = true; }
        if (entity.getPathId()        != null) { update.set(b.pathId,        entity.getPathId());        hasAny = true; }
        if (entity.getBbmTypeCd()     != null) { update.set(b.bbmTypeCd,     entity.getBbmTypeCd());     hasAny = true; }
        if (entity.getAllowComment()  != null) { update.set(b.allowComment,  entity.getAllowComment());  hasAny = true; }
        if (entity.getAllowAttach()   != null) { update.set(b.allowAttach,   entity.getAllowAttach());   hasAny = true; }
        if (entity.getAllowLike()     != null) { update.set(b.allowLike,     entity.getAllowLike());     hasAny = true; }
        if (entity.getContentTypeCd() != null) { update.set(b.contentTypeCd, entity.getContentTypeCd()); hasAny = true; }
        if (entity.getScopeTypeCd()   != null) { update.set(b.scopeTypeCd,   entity.getScopeTypeCd());   hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(b.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(b.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getBbmRemark()     != null) { update.set(b.bbmRemark,     entity.getBbmRemark());     hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(b.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(b.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(b.bbmId.eq(entity.getBbmId())).execute();
        return (int) affected;
    }
}
