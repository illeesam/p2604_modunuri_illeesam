package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdTagDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdTag;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdTag;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdTagRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdTag(태그) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdTagRepositoryImpl implements QPdTagRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdTagRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPdTag  pdTag   = QPdTag.pdTag;
    private static final QSySite sySite = QSySite.sySite;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * USE_YN  {Y: '사용', N: '미사용'}
     */
    /* 태그 baseSelColumnQuery */
    private JPAQuery<PdTagDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdTagDto.Item.class,
                        pdTag.tagId,       // 태그ID (PK, YYMMDDhhmmss+rand4)
                        pdTag.tagNm,       // 태그명
                        pdTag.tagDesc,     // 태그설명
                        pdTag.useCount,    // 사용 빈도
                        pdTag.sortOrd,     // 정렬순서
                        pdTag.useYn,         // 사용여부 — {Y: '사용', N: '미사용'}
                        pdTag.regBy,      // 등록자
                        pdTag.regDate,    // 등록일시
                        pdTag.updBy,      // 수정자
                        pdTag.updDate,    // 수정일시
                        pdTag.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdTag.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pdTag)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdTag.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdTag.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdTag.siteId)) // 사이트

                ;
    }

    /* 태그 키조회 */
    @Override
    public Optional<PdTagDto.Item> selectById(String tagId) {
        PdTagDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdTag.tagId.eq(tagId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 태그 목록조회 */
    @Override
    public List<PdTagDto.Item> selectList(PdTagDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdTag.tagId, search.getTagId())); // 태그ID (단건 조회 필터)
        whereList.add(QdslUtil.strEq(pdTag.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdTag.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdTag.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdTag.siteId, search.getSiteId())); // 사이트ID (검색 필터)

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdTagDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<PdTagDto.Item> list = query.fetch();
        return list;
    }

    /* 태그 페이지조회 */
    @Override
    public BasePage<PdTagDto.Item> selectPageData(PdTagDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdTag.tagId, search.getTagId())); // 태그ID (단건 조회 필터)
        whereList.add(QdslUtil.strEq(pdTag.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdTag.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdTag.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdTag.siteId, search.getSiteId())); // 사이트ID (검색 필터)
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdTagDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdTagDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdTag.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdTagDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 예: "tagDesc,tagId,tagNm,useYn" (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("tagDesc", pdTag.tagDesc), // 태그설명
            QdslUtil.FieldDef.like("tagId", pdTag.tagId), // 태그ID (단건 조회 필터)
            QdslUtil.FieldDef.like("tagNm", pdTag.tagNm), // 태그명
            QdslUtil.FieldDef.like("useYn", pdTag.useYn) // 사용여부 필터 Y/N
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("tagId", pdTag.tagId,
                   "tagNm", pdTag.tagNm,
                   "regDate", pdTag.regDate,
                   "sortOrd", pdTag.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdTag.sortOrd),
        new OrderSpecifier<>(Order.ASC, pdTag.regDate),
        new OrderSpecifier<>(Order.ASC, pdTag.tagId));
    }

    /* 태그 수정 */
    @Override
    public int updateSelective(PdTag entity) {
        if (entity.getTagId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdTag);
        boolean hasAny = false;

        if (entity.getTagNm()    != null) { update.set(pdTag.tagNm,    entity.getTagNm());    hasAny = true; }
        if (entity.getTagDesc()  != null) { update.set(pdTag.tagDesc,  entity.getTagDesc());  hasAny = true; }
        if (entity.getUseCount() != null) { update.set(pdTag.useCount, entity.getUseCount()); hasAny = true; }
        if (entity.getSortOrd()  != null) { update.set(pdTag.sortOrd,  entity.getSortOrd());  hasAny = true; }
        if (entity.getUseYn()    != null) { update.set(pdTag.useYn,    entity.getUseYn());    hasAny = true; }
        if (entity.getUpdBy()    != null) { update.set(pdTag.updBy,    entity.getUpdBy());    hasAny = true; }
        update.set(pdTag.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdTag.tagId.eq(entity.getTagId())).execute();
        return (int) affected;
    }
}
