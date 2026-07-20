package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmSaveItem QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmSaveItemRepositoryImpl implements QPmSaveItemRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmSaveItemRepositoryImpl";
    private static final QPmSaveItem pmSaveItem    = QPmSaveItem.pmSaveItem;
    private static final QPmSave     pmSave  = QPmSave.pmSave;
    private static final QSySite     sySite  = QSySite.sySite;
    private static final QSyCode     cdSit = new QSyCode("cd_sit");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmSaveItem.regDate,
        "upd_date", pmSaveItem.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("saveId", pmSaveItem.saveId),
        Map.entry("saveItemId", pmSaveItem.saveItemId),
        Map.entry("siteId", pmSaveItem.siteId),
        Map.entry("targetId", pmSaveItem.targetId),
        Map.entry("targetTypeCd", pmSaveItem.targetTypeCd)
    );

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
                    QdslUtil.strEq(pmSaveItem.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmSaveItem.saveItemId, search.getSaveItemId()),
                    QdslUtil.strEq(pmSaveItem.saveId, search.getSaveId()),
                    QdslUtil.strEq(pmSaveItem.targetId, search.getTargetId()),
                    QdslUtil.strEq(pmSaveItem.targetTypeCd, search.getTargetTypeCd()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
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

    /* 적립금 대상 상품 페이지조회 */
    @Override
    public PmSaveItemDto.PageResponse selectPageData(PmSaveItemDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmSaveItem.siteId, search.getSiteId()),
                QdslUtil.strEq(pmSaveItem.saveItemId, search.getSaveItemId()),
                QdslUtil.strEq(pmSaveItem.saveId, search.getSaveId()),
                QdslUtil.strEq(pmSaveItem.targetId, search.getTargetId()),
                QdslUtil.strEq(pmSaveItem.targetTypeCd, search.getTargetTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmSaveItemDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmSaveItemDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmSaveItem.count())
                .where(wheres)
                .fetchOne();

        PmSaveItemDto.PageResponse res = new PmSaveItemDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 적립금 대상 상품 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(PmSaveItemDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
