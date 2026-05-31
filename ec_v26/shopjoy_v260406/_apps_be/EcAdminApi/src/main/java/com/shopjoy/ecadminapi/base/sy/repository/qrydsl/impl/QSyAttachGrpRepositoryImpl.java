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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyAttachGrpRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyAttachGrp QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyAttachGrpRepositoryImpl implements QSyAttachGrpRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyAttachGrpRepositoryImpl";
    private static final QSyAttachGrp g = QSyAttachGrp.syAttachGrp;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /* 첨부파일 그룹 키조회 */
    @Override
    public Optional<SyAttachGrpDto.Item> selectById(String attachGrpId) {
        SyAttachGrpDto.Item dto = baseQuery().where(g.attachGrpId.eq(attachGrpId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 첨부파일 그룹 목록조회 */
    @Override
    public List<SyAttachGrpDto.Item> selectList(SyAttachGrpDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyAttachGrpDto.Item> query = baseQuery().where(
                baseAndAttachGrpId(search),
                baseAndSearchValue(search)
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

    /* 첨부파일 그룹 페이지조회 */
    @Override
    public SyAttachGrpDto.PageResponse selectPageList(SyAttachGrpDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyAttachGrpDto.Item> query = baseQuery().where(
                baseAndAttachGrpId(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        List<SyAttachGrpDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory.select(g.count()).from(g).where(
                baseAndAttachGrpId(search),
                baseAndSearchValue(search)
        ).fetchOne();

        SyAttachGrpDto.PageResponse res = new SyAttachGrpDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 첨부파일 그룹 baseQuery */
    private JPAQuery<SyAttachGrpDto.Item> baseQuery() {
        return queryFactory
                .select(Projections.bean(SyAttachGrpDto.Item.class,
                        g.attachGrpId, g.attachGrpCode, g.attachGrpNm, g.fileExtAllow,
                        g.maxFileSize, g.maxFileCount, g.storagePath, g.useYn, g.sortOrd,
                        g.attachGrpRemark, g.regBy, g.regDate, g.updBy, g.updDate
                ))
                .from(g);
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* attachGrpId 정확 일치 */
    private BooleanExpression baseAndAttachGrpId(SyAttachGrpDto.Request search) {
        return search != null && StringUtils.hasText(search.getAttachGrpId())
                ? g.attachGrpId.eq(search.getAttachGrpId()) : null;
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyAttachGrpDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",attachGrpCode,", g.attachGrpCode, pattern);
        or = orLike(or, all, types, ",attachGrpId,", g.attachGrpId, pattern);
        or = orLike(or, all, types, ",attachGrpNm,", g.attachGrpNm, pattern);
        or = orLike(or, all, types, ",attachGrpRemark,", g.attachGrpRemark, pattern);
        or = orLike(or, all, types, ",fileExtAllow,", g.fileExtAllow, pattern);
        or = orLike(or, all, types, ",siteId,", g.siteId, pattern);
        or = orLike(or, all, types, ",storagePath,", g.storagePath, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyAttachGrpDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, g.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, g.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, g.attachGrpId));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("attachGrpId".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.attachGrpId));
                } else if ("attachGrpNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.attachGrpNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, g.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, g.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, g.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, g.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, g.attachGrpId));
        }
        return orders;
    }

    /* 첨부파일 그룹 수정 */
    @Override
    public int updateSelective(SyAttachGrp entity) {
        if (entity.getAttachGrpId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(g);
        boolean hasAny = false;

        if (entity.getAttachGrpCode()   != null) { update.set(g.attachGrpCode,   entity.getAttachGrpCode());   hasAny = true; }
        if (entity.getAttachGrpNm()     != null) { update.set(g.attachGrpNm,     entity.getAttachGrpNm());     hasAny = true; }
        if (entity.getFileExtAllow()    != null) { update.set(g.fileExtAllow,    entity.getFileExtAllow());    hasAny = true; }
        if (entity.getMaxFileSize()     != null) { update.set(g.maxFileSize,     entity.getMaxFileSize());     hasAny = true; }
        if (entity.getMaxFileCount()    != null) { update.set(g.maxFileCount,    entity.getMaxFileCount());    hasAny = true; }
        if (entity.getStoragePath()     != null) { update.set(g.storagePath,     entity.getStoragePath());     hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(g.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getSortOrd()         != null) { update.set(g.sortOrd,         entity.getSortOrd());         hasAny = true; }
        if (entity.getAttachGrpRemark() != null) { update.set(g.attachGrpRemark, entity.getAttachGrpRemark()); hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(g.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(g.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(g.attachGrpId.eq(entity.getAttachGrpId())).execute();
        return (int) affected;
    }
}
