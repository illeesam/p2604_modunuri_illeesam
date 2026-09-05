package com.shopjoy.ecadminapi.md.cb.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.md.cb.data.dto.MdCbSymbolDto;
import com.shopjoy.ecadminapi.md.cb.data.entity.MdCbSymbol;
import com.shopjoy.ecadminapi.md.cb.data.entity.QMdCbSymbol;
import com.shopjoy.ecadminapi.md.cb.repository.qrydsl.QMdCbSymbolRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** MdCbSymbol(코바늘 기호) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMdCbSymbolRepositoryImpl implements QMdCbSymbolRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "md.cb.repository.qrydsl.impl.QMdCbSymbolRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QMdCbSymbol mdCbSymbol = QMdCbSymbol.mdCbSymbol;

    /* baseSelColumnQuery — 코드성 필드 예시 코드값: USE_YN {Y:'사용', N:'미사용'} */
    private JPAQuery<MdCbSymbolDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MdCbSymbolDto.Item.class,
                        mdCbSymbol.symbolId,        // 기호ID (PK)
                        mdCbSymbol.symbolCd,        // 기호코드
                        mdCbSymbol.symbolNm,        // 기호명 (한글)
                        mdCbSymbol.symbolChar,      // 격자 표시용 기호 문자
                        mdCbSymbol.symbolDesc,      // 기호 설명
                        mdCbSymbol.stitchConsume,   // 소모 코 수
                        mdCbSymbol.stitchProduce,   // 생성 코 수
                        mdCbSymbol.sortOrd,         // 정렬순서
                        mdCbSymbol.useYn,           // 사용여부 Y/N
                        mdCbSymbol.regBy,           // 등록자
                        mdCbSymbol.regDate,         // 등록일시
                        mdCbSymbol.updBy,           // 수정자
                        mdCbSymbol.updDate,         // 수정일시
                        mdCbSymbol.regSiteId,       // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),  // 등록자명 (조인)
                        mdCbSymbol.siteId,          // 사이트ID
                        siteEx.siteNm.as("siteNm")         // 사이트명 (조인)
                ))
                .from(mdCbSymbol)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(mdCbSymbol.regSiteId))
                .leftJoin(regUserEx).on(regUserEx.userId.eq(mdCbSymbol.regBy))
                .leftJoin(siteEx).on(siteEx.siteId.eq(mdCbSymbol.siteId))
                ;
    }

    @Override
    public Optional<MdCbSymbolDto.Item> selectById(String symbolId) {
        MdCbSymbolDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mdCbSymbol.symbolId.eq(symbolId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    @Override
    public List<MdCbSymbolDto.Item> selectList(MdCbSymbolDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mdCbSymbol.symbolId, search.getSymbolId()));
        whereList.add(QdslUtil.strEq(mdCbSymbol.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbSymbol.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbSymbol.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mdCbSymbol.siteId, search.getSiteId()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MdCbSymbolDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public BasePage<MdCbSymbolDto.Item> selectPageData(MdCbSymbolDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mdCbSymbol.symbolId, search.getSymbolId()));
        whereList.add(QdslUtil.strEq(mdCbSymbol.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbSymbol.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbSymbol.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mdCbSymbol.siteId, search.getSiteId()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<MdCbSymbolDto.Item> query = baseSelColumnQuery();
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MdCbSymbolDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(pageSize)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mdCbSymbol.count())
                .where(wheres)
                .fetchOne();

        BasePage<MdCbSymbolDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "symbolCd,symbolDesc,symbolId,symbolNm" (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("symbolCd", mdCbSymbol.symbolCd),
            QdslUtil.FieldDef.like("symbolDesc", mdCbSymbol.symbolDesc),
            QdslUtil.FieldDef.like("symbolId", mdCbSymbol.symbolId),
            QdslUtil.FieldDef.like("symbolNm", mdCbSymbol.symbolNm)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("symbolId", mdCbSymbol.symbolId,
                   "symbolNm", mdCbSymbol.symbolNm,
                   "regDate", mdCbSymbol.regDate,
                   "sortOrd", mdCbSymbol.sortOrd),
        new OrderSpecifier<>(Order.ASC, mdCbSymbol.sortOrd),
        new OrderSpecifier<>(Order.ASC, mdCbSymbol.regDate),
        new OrderSpecifier<>(Order.ASC, mdCbSymbol.symbolId));
    }

    @Override
    public int updateSelective(MdCbSymbol entity) {
        if (entity.getSymbolId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(mdCbSymbol);
        boolean hasAny = false;

        if (entity.getSymbolCd()      != null) { update.set(mdCbSymbol.symbolCd,      entity.getSymbolCd());      hasAny = true; }
        if (entity.getSymbolNm()      != null) { update.set(mdCbSymbol.symbolNm,      entity.getSymbolNm());      hasAny = true; }
        if (entity.getSymbolChar()    != null) { update.set(mdCbSymbol.symbolChar,    entity.getSymbolChar());    hasAny = true; }
        if (entity.getSymbolDesc()    != null) { update.set(mdCbSymbol.symbolDesc,    entity.getSymbolDesc());    hasAny = true; }
        if (entity.getStitchConsume() != null) { update.set(mdCbSymbol.stitchConsume, entity.getStitchConsume()); hasAny = true; }
        if (entity.getStitchProduce() != null) { update.set(mdCbSymbol.stitchProduce, entity.getStitchProduce()); hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(mdCbSymbol.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(mdCbSymbol.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(mdCbSymbol.updBy,         entity.getUpdBy());         hasAny = true; }
        update.set(mdCbSymbol.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(mdCbSymbol.symbolId.eq(entity.getSymbolId())).execute();
        return (int) affected;
    }
}
