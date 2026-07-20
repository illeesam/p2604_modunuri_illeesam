package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleAdj;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleAdjRepository;
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
/** StSettleAdj QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleAdjRepositoryImpl implements QStSettleAdjRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleAdjRepositoryImpl";
    private static final QStSettleAdj stSettleAdj    = QStSettleAdj.stSettleAdj;
    private static final QSySite     sySite  = QSySite.sySite;
    private static final QSyCode     cdSat = new QSyCode("cd_sat");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", stSettleAdj.regDate,
        "upd_date", stSettleAdj.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("adjReason", stSettleAdj.adjReason),
        Map.entry("adjTypeCd", stSettleAdj.adjTypeCd),
        Map.entry("aprvStatusCd", stSettleAdj.aprvStatusCd),
        Map.entry("settleAdjId", stSettleAdj.settleAdjId),
        Map.entry("settleAdjMemo", stSettleAdj.settleAdjMemo),
        Map.entry("settleId", stSettleAdj.settleId),
        Map.entry("siteId", stSettleAdj.siteId),
        Map.entry("siteNm", sySite.siteNm)
    );

    /* 정산 조정 baseListQuery */
    private JPAQuery<StSettleAdjDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleAdjDto.Item.class,
                        stSettleAdj.settleAdjId, stSettleAdj.settleId, stSettleAdj.siteId,
                        stSettleAdj.adjTypeCd, stSettleAdj.adjAmt, stSettleAdj.adjReason,
                        stSettleAdj.settleAdjMemo, stSettleAdj.aprvStatusCd,
                        stSettleAdj.regBy, stSettleAdj.regDate, stSettleAdj.updBy, stSettleAdj.updDate,
                        sySite.siteNm.as("siteNm"),
                        cdSat.codeLabel.as("adjTypeCdNm")
                ))
                .from(stSettleAdj)
                .leftJoin(sySite).on(sySite.siteId.eq(stSettleAdj.siteId))
                .leftJoin(cdSat).on(cdSat.codeGrp.eq("SETTLE_ADJ_TYPE").and(cdSat.codeValue.eq(stSettleAdj.adjTypeCd)));
    }

    /* 정산 조정 키조회 */
    @Override
    public Optional<StSettleAdjDto.Item> selectById(String id) {
        StSettleAdjDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettleAdj.settleAdjId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 조정 목록조회 */
    @Override
    public List<StSettleAdjDto.Item> selectList(StSettleAdjDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleAdjDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(stSettleAdj.siteId, search.getSiteId()),
                    QdslUtil.strEq(stSettleAdj.settleAdjId, search.getSettleAdjId()),
                    QdslUtil.strEq(stSettleAdj.adjTypeCd, search.getAdjTypeCd()),
                    QdslUtil.strEq(stSettleAdj.aprvStatusCd, search.getAprvStatusCd()),
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

    /* 정산 조정 페이지조회 */
    @Override
    public StSettleAdjDto.PageResponse selectPageData(StSettleAdjDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(stSettleAdj.siteId, search.getSiteId()),
                QdslUtil.strEq(stSettleAdj.settleAdjId, search.getSettleAdjId()),
                QdslUtil.strEq(stSettleAdj.adjTypeCd, search.getAdjTypeCd()),
                QdslUtil.strEq(stSettleAdj.aprvStatusCd, search.getAprvStatusCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StSettleAdjDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StSettleAdjDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettleAdj.count())
                .where(wheres)
                .fetchOne();

        StSettleAdjDto.PageResponse res = new StSettleAdjDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 정산 조정 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(StSettleAdjDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettleAdjDto.Request c) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = c == null ? null : c.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, stSettleAdj.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleAdj.settleAdjId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleAdjId".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleAdj.settleAdjId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleAdj.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stSettleAdj.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleAdj.settleAdjId));
        }
        return orders;
    }

    /* 정산 조정 수정 */
    @Override
    public int updateSelective(StSettleAdj entity) {
        if (entity.getSettleAdjId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettleAdj);
        boolean hasAny = false;

        if (entity.getSettleId()      != null) { update.set(stSettleAdj.settleId,      entity.getSettleId());      hasAny = true; }
        if (entity.getSiteId()        != null) { update.set(stSettleAdj.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getAdjTypeCd()     != null) { update.set(stSettleAdj.adjTypeCd,     entity.getAdjTypeCd());     hasAny = true; }
        if (entity.getAdjAmt()        != null) { update.set(stSettleAdj.adjAmt,        entity.getAdjAmt());        hasAny = true; }
        if (entity.getAdjReason()     != null) { update.set(stSettleAdj.adjReason,     entity.getAdjReason());     hasAny = true; }
        if (entity.getSettleAdjMemo() != null) { update.set(stSettleAdj.settleAdjMemo, entity.getSettleAdjMemo()); hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(stSettleAdj.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stSettleAdj.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettleAdj.settleAdjId.eq(entity.getSettleAdjId())).execute();
        return (int) affected;
    }
}
