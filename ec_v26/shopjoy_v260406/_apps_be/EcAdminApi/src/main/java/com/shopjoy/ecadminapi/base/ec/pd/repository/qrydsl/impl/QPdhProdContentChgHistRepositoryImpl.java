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
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdContentChgHistDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdContentChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdhProdContentChgHist;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdhProdContentChgHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PdhProdContentChgHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdhProdContentChgHistRepositoryImpl implements QPdhProdContentChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdhProdContentChgHistRepositoryImpl";
    private static final QPdhProdContentChgHist pdhProdContentChgHist   = QPdhProdContentChgHist.pdhProdContentChgHist;
    private static final QSySite                sySite = QSySite.sySite;
    private static final QPdProd                pdProd = QPdProd.pdProd;
    private static final QSyUser                syUser = QSyUser.syUser;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값 (sy_code 등록 기준)
     * CONTENT_TYPE_CD (PROD_CONTENT_TYPE)  {DETAIL: '상세설명', NOTICE: '상품공지', GUIDE: '이용안내', SIZE_GUIDE: '사이즈안내'}
     */
    /* 상품 콘텐츠 변경 이력 baseSelColumnQuery */
    private JPAQuery<PdhProdContentChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdhProdContentChgHistDto.Item.class,
                        pdhProdContentChgHist.histId,           // 이력ID (PK, YYMMDDhhmmss+rand4)
                        pdhProdContentChgHist.prodId,            // 상품ID (pd_prod.prod_id)
                        pdhProdContentChgHist.prodContentId,      // 상품컨텐츠ID (pd_prod_content.)
                        pdhProdContentChgHist.contentTypeCd,       // 컨텐츠유형코드 — {DETAIL: '상세설명', NOTICE: '상품공지', GUIDE: '이용안내', SIZE_GUIDE: '사이즈안내'}
                        pdhProdContentChgHist.contentBefore,     // 변경전 HTML 컨텐츠
                        pdhProdContentChgHist.contentAfter,      // 변경후 HTML 컨텐츠
                        pdhProdContentChgHist.chgReason,         // 변경사유
                        pdhProdContentChgHist.chgUserId,          // 처리자 (sy_user.user_id)
                        pdhProdContentChgHist.chgDate,           // 처리일시
                        pdhProdContentChgHist.regBy, pdhProdContentChgHist.regDate, pdhProdContentChgHist.updBy, pdhProdContentChgHist.updDate
                ))
                .from(pdhProdContentChgHist)
                .leftJoin(pdProd).on(pdProd.prodId.eq(pdhProdContentChgHist.prodId)) // 상품
                .leftJoin(syUser).on(syUser.userId.eq(pdhProdContentChgHist.chgUserId)) // 사용자
                ;
    }

    /* 상품 콘텐츠 변경 이력 키조회 */
    @Override
    public Optional<PdhProdContentChgHistDto.Item> selectById(String id) {
        PdhProdContentChgHistDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(pdhProdContentChgHist.histId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 상품 콘텐츠 변경 이력 목록조회 */
    @Override
    public List<PdhProdContentChgHistDto.Item> selectList(PdhProdContentChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdhProdContentChgHist.histId, search.getHistId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdhProdContentChgHist.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdhProdContentChgHist.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdhProdContentChgHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<PdhProdContentChgHistDto.Item> list = query.fetch();
        return list;
    }

    /* 상품 콘텐츠 변경 이력 페이지조회 */
    @Override
    public BasePage<PdhProdContentChgHistDto.Item> selectPageData(PdhProdContentChgHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdhProdContentChgHist.histId, search.getHistId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdhProdContentChgHist.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdhProdContentChgHist.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdhProdContentChgHistDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdhProdContentChgHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdhProdContentChgHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdhProdContentChgHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("chgReason", pdhProdContentChgHist.chgReason),
            QdslUtil.FieldDef.like("chgUserId", pdhProdContentChgHist.chgUserId),
            QdslUtil.FieldDef.like("contentAfter", pdhProdContentChgHist.contentAfter),
            QdslUtil.FieldDef.like("contentBefore", pdhProdContentChgHist.contentBefore),
            QdslUtil.FieldDef.like("contentTypeCd", pdhProdContentChgHist.contentTypeCd),
            QdslUtil.FieldDef.like("histId", pdhProdContentChgHist.histId),
            QdslUtil.FieldDef.like("prodContentId", pdhProdContentChgHist.prodContentId),
            QdslUtil.FieldDef.like("prodId", pdhProdContentChgHist.prodId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("histId", pdhProdContentChgHist.histId,
                   "regDate", pdhProdContentChgHist.regDate),
        new OrderSpecifier<>(Order.DESC, pdhProdContentChgHist.regDate),
        new OrderSpecifier<>(Order.ASC, pdhProdContentChgHist.histId));
    }

    /* 상품 콘텐츠 변경 이력 수정 */
    @Override
    public int updateSelective(PdhProdContentChgHist entity) {
        if (entity.getHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdhProdContentChgHist);
        boolean hasAny = false;

        if (entity.getProdId()        != null) { update.set(pdhProdContentChgHist.prodId,        entity.getProdId());        hasAny = true; }
        if (entity.getProdContentId() != null) { update.set(pdhProdContentChgHist.prodContentId, entity.getProdContentId()); hasAny = true; }
        if (entity.getContentTypeCd() != null) { update.set(pdhProdContentChgHist.contentTypeCd, entity.getContentTypeCd()); hasAny = true; }
        if (entity.getContentBefore() != null) { update.set(pdhProdContentChgHist.contentBefore, entity.getContentBefore()); hasAny = true; }
        if (entity.getContentAfter()  != null) { update.set(pdhProdContentChgHist.contentAfter,  entity.getContentAfter());  hasAny = true; }
        if (entity.getChgReason()     != null) { update.set(pdhProdContentChgHist.chgReason,     entity.getChgReason());     hasAny = true; }
        if (entity.getChgUserId()     != null) { update.set(pdhProdContentChgHist.chgUserId,     entity.getChgUserId());     hasAny = true; }
        if (entity.getChgDate()       != null) { update.set(pdhProdContentChgHist.chgDate,       entity.getChgDate());       hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(pdhProdContentChgHist.updBy,         entity.getUpdBy());         hasAny = true; }
        update.set(pdhProdContentChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdhProdContentChgHist.histId.eq(entity.getHistId())).execute();
        return (int) affected;
    }
}
