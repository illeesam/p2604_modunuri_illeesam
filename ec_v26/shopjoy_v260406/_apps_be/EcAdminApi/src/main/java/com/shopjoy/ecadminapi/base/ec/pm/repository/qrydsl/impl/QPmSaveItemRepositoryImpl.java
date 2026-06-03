package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSave;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmSaveItem;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmSaveItemRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** PmSaveItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveItemRepositoryImpl implements QPmSaveItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmSaveItemRepositoryImpl";
    private static final QPmSaveItem pmSaveItem    = QPmSaveItem.pmSaveItem;
    private static final QPmSave     pmSave  = QPmSave.pmSave;
    private static final QSySite     sySite  = QSySite.sySite;
    private static final QSyCode     cdSit = new QSyCode("cd_sit");

    /* 적립금 대상 상품 baseSelColumnQuery */
    private JPAQuery<PmSaveItemDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmSaveItemDto.Item.class,
                        pmSaveItem.saveItemId, pmSaveItem.saveId, pmSaveItem.siteId, pmSaveItem.targetTypeCd, pmSaveItem.targetId,
                        pmSaveItem.regBy, pmSaveItem.regDate,
                        sySite.siteNm.as("siteNm"),
                        cdSit.codeLabel.as("targetTypeCdNm")
                ))
                .from(pmSaveItem)
                .leftJoin(pmSave).on(pmSave.saveId.eq(pmSaveItem.saveId))
                .leftJoin(sySite).on(sySite.siteId.eq(pmSaveItem.siteId))
                .leftJoin(cdSit).on(cdSit.codeGrp.eq("SAVE_ITEM_TARGET").and(cdSit.codeValue.eq(pmSaveItem.targetTypeCd)));
    }

    /* 적립금 대상 상품 키조회 */
    @Override
    public Optional<PmSaveItemDto.Item> selectById(String saveItemId) {
        PmSaveItemDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmSaveItem.saveItemId.eq(saveItemId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 적립금 대상 상품 목록조회 */
    @Override
    public List<PmSaveItemDto.Item> selectList(PmSaveItemDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmSaveItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    baseAndSiteId(search),
                    baseAndSaveItemId(search),
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

    /* 적립금 대상 상품 페이지조회 */
    @Override
    public PmSaveItemDto.PageResponse selectPageData(PmSaveItemDto.Request search) {
        int pageNo   = search != null && search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndSaveItemId(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<PmSaveItemDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<PmSaveItemDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(pmSaveItem.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt").from(pmSaveItem)
                .where(wheres)
                .fetchOne();

        PmSaveItemDto.PageResponse res = new PmSaveItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 적립금 대상 상품 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(PmSaveItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? pmSaveItem.siteId.eq(search.getSiteId()) : null;
    }

    /* saveItemId 정확 일치 */
    private BooleanExpression baseAndSaveItemId(PmSaveItemDto.Request search) {
        return search != null && StringUtils.hasText(search.getSaveItemId())
                ? pmSaveItem.saveItemId.eq(search.getSaveItemId()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(PmSaveItemDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "reg_date": return pmSaveItem.regDate.goe(start).and(pmSaveItem.regDate.lt(endExcl));
            case "upd_date": return pmSaveItem.updDate.goe(start).and(pmSaveItem.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(PmSaveItemDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",saveId,", pmSaveItem.saveId, pattern);
        or = orLike(or, all, types, ",saveItemId,", pmSaveItem.saveItemId, pattern);
        or = orLike(or, all, types, ",siteId,", pmSaveItem.siteId, pattern);
        or = orLike(or, all, types, ",targetId,", pmSaveItem.targetId, pattern);
        or = orLike(or, all, types, ",targetTypeCd,", pmSaveItem.targetTypeCd, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(PmSaveItemDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmSaveItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmSaveItem.saveItemId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("saveItemId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmSaveItem.saveItemId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmSaveItem.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmSaveItem.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmSaveItem.saveItemId));
        }
        return orders;
    }

    /* 적립금 대상 상품 수정 */
    @Override
    public int updateSelective(PmSaveItem entity) {
        if (entity.getSaveItemId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmSaveItem);
        boolean hasAny = false;

        if (entity.getSaveId()       != null) { update.set(pmSaveItem.saveId,       entity.getSaveId());       hasAny = true; }
        if (entity.getSiteId()       != null) { update.set(pmSaveItem.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getTargetTypeCd() != null) { update.set(pmSaveItem.targetTypeCd, entity.getTargetTypeCd()); hasAny = true; }
        if (entity.getTargetId()     != null) { update.set(pmSaveItem.targetId,     entity.getTargetId());     hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(pmSaveItem.saveItemId.eq(entity.getSaveItemId())).execute();
        return (int) affected;
    }
}
