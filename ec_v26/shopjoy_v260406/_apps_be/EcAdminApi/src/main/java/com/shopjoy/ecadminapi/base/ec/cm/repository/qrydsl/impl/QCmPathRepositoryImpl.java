package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPathDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmPath;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmPathRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** CmPath QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmPathRepositoryImpl implements QCmPathRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmPathRepositoryImpl";
    private static final QCmPath cmPath = QCmPath.cmPath;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", cmPath.regDate,
        "upd_date", cmPath.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("bizCd", cmPath.bizCd),
        Map.entry("pathLabel", cmPath.pathLabel),
        Map.entry("pathRemark", cmPath.pathRemark),
        Map.entry("siteId", cmPath.siteId),
        Map.entry("useYn", cmPath.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 실제 코드값
     * USE_YN  {Y: '사용', N: '미사용'} — sy_code 미등록, use_yn 전역 공통 규약
     */
    private JPAQuery<CmPathDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmPathDto.Item.class,
                        cmPath.bizCd,         // 업무코드 (PK, 참조 테이블명, 예: sy_brand / sy_code_grp / ec_prop)
                        cmPath.parentPathId,  // 부모 경로ID (sy_path., 루트는 NULL)
                        cmPath.pathLabel,     // 경로 라벨 (한글 표시명)
                        cmPath.sortOrd,       // 동일 부모 내 정렬순서
                        cmPath.useYn,         // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        cmPath.pathRemark,    // 비고
                        cmPath.regBy,         // 등록자
                        cmPath.regDate,       // 등록일시
                        cmPath.updBy,         // 수정자
                        cmPath.updDate        // 수정일시
                ))
                .from(cmPath);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmPathDto.Item> selectById(String bizCd) {
        CmPathDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmPath.bizCd.eq(bizCd))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmPathDto.Item> selectList(CmPathDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmPathDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(cmPath.useYn, search.getUseYn()),
                QdslUtil.strEq(cmPath.bizCd, search.getBizCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /** 페이지 목록 */
    @Override
    public CmPathDto.PageResponse selectPageData(CmPathDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(cmPath.useYn, search.getUseYn()),
                QdslUtil.strEq(cmPath.bizCd, search.getBizCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<CmPathDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<CmPathDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmPath.count())
                .where(wheres)
                .fetchOne();

        CmPathDto.PageResponse res = new CmPathDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(CmPathDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmPathDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {

            /* sortOrd ASC + regDate ASC (전역 정책) */
            orders.add(new OrderSpecifier<>(Order.ASC, cmPath.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, cmPath.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmPath.bizCd));

            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("bizCd".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmPath.bizCd));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmPath.regDate));
                }
                else if ("sortOrd".equals(field)) { orders.add(new OrderSpecifier(order, cmPath.sortOrd)); }
            }
        }
        /* unknown sort → sortOrd ASC + regDate ASC fallback */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, cmPath.sortOrd));
            orders.add(new OrderSpecifier<>(Order.ASC, cmPath.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmPath.bizCd));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmPath entity) {
        if (entity.getBizCd() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmPath);
        boolean hasAny = false;

        if (entity.getParentPathId() != null) { update.set(cmPath.parentPathId, entity.getParentPathId()); hasAny = true; }
        if (entity.getPathLabel()    != null) { update.set(cmPath.pathLabel,    entity.getPathLabel());    hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(cmPath.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(cmPath.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getPathRemark()   != null) { update.set(cmPath.pathRemark,   entity.getPathRemark());   hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(cmPath.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(cmPath.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmPath.bizCd.eq(entity.getBizCd())).execute();
        return (int) affected;
    }
}
