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
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdRestockNotiDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdRestockNoti;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdRestockNotiRepository;
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
/** PdRestockNoti(재입고알림 신청) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPdRestockNotiRepositoryImpl implements QPdRestockNotiRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pd.repository.qrydsl.impl.QPdRestockNotiRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPdRestockNoti pdRestockNoti   = QPdRestockNoti.pdRestockNoti;
    private static final QSySite        sySite = QSySite.sySite;
    private static final QPdProd        pdProd = QPdProd.pdProd;
    private static final QMbMember      mbMember = QMbMember.mbMember;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * NOTI_YN  {Y: '발송완료', N: '미발송'}
     */
    /* 재입고 알림 baseSelColumnQuery */
    private JPAQuery<PdRestockNotiDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PdRestockNotiDto.Item.class,
                        pdRestockNoti.restockNotiId,   // 재입고알림ID (PK, YYMMDDhhmmss+rand4)
                        pdRestockNoti.prodId,           // 상품ID (pd_prod.prod_id)
                        pdRestockNoti.prodSkuId,        // SKUID (pd_prod_sku.prod_sku_id)
                        pdRestockNoti.memberId,         // 회원ID (mb_member.member_id)
                        pdRestockNoti.notiYn,             // 알림발송여부 — {Y: '발송완료', N: '미발송'}
                        pdRestockNoti.notiDate,         // 알림발송일시
                        pdRestockNoti.regBy,      // 등록자
                        pdRestockNoti.regDate,    // 등록일시
                        pdRestockNoti.updBy,      // 수정자
                        pdRestockNoti.updDate,    // 수정일시
                        pdRestockNoti.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        pdRestockNoti.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(pdRestockNoti)
                .innerJoin(pdProd).on(pdProd.prodId.eq(pdRestockNoti.prodId)) // 상품
                .innerJoin(mbMember).on(mbMember.memberId.eq(pdRestockNoti.memberId)) // 회원
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pdRestockNoti.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pdRestockNoti.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(pdRestockNoti.siteId)) // 사이트

                ;
    }

    /* 재입고 알림 키조회 */
    @Override
    public Optional<PdRestockNotiDto.Item> selectById(String restockNotiId) {
        PdRestockNotiDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pdRestockNoti.restockNotiId.eq(restockNotiId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 재입고 알림 목록조회 */
    @Override
    public List<PdRestockNotiDto.Item> selectList(PdRestockNotiDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdRestockNoti.restockNotiId, search.getRestockNotiId())); // 재입고알림ID (단건 조회 필터)
        whereList.add(QdslUtil.strEq(pdRestockNoti.prodId, search.getProdId())); // 상품ID 필터
        whereList.add(QdslUtil.strEq(pdRestockNoti.notiYn, search.getNotiYn())); // 알림발송여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdRestockNoti.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdRestockNoti.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdRestockNoti.siteId, search.getSiteId())); // 사이트ID (검색 필터)

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PdRestockNotiDto.Item> query = baseSelColumnQuery()
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
        List<PdRestockNotiDto.Item> list = query.fetch();
        return list;
    }

    /* 재입고 알림 페이지조회 */
    @Override
    public BasePage<PdRestockNotiDto.Item> selectPageData(PdRestockNotiDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pdRestockNoti.restockNotiId, search.getRestockNotiId())); // 재입고알림ID (단건 조회 필터)
        whereList.add(QdslUtil.strEq(pdRestockNoti.prodId, search.getProdId())); // 상품ID 필터
        whereList.add(QdslUtil.strEq(pdRestockNoti.notiYn, search.getNotiYn())); // 알림발송여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdRestockNoti.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pdRestockNoti.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(pdRestockNoti.siteId, search.getSiteId())); // 사이트ID (검색 필터)
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PdRestockNotiDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PdRestockNotiDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pdRestockNoti.count())
                .where(wheres)
                .fetchOne();

        BasePage<PdRestockNotiDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "memberId,notiYn,prodId,restockNotiId,skuId" (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("memberId", pdRestockNoti.memberId), // 회원ID (mb_member.member_id)
            QdslUtil.FieldDef.like("notiYn", pdRestockNoti.notiYn), // 알림발송여부 필터 Y/N
            QdslUtil.FieldDef.like("prodId", pdRestockNoti.prodId), // 상품ID 필터
            QdslUtil.FieldDef.like("restockNotiId", pdRestockNoti.restockNotiId), // 재입고알림ID (단건 조회 필터)
            QdslUtil.FieldDef.like("skuId", pdRestockNoti.prodSkuId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("restockNotiId", pdRestockNoti.restockNotiId,
                   "regDate", pdRestockNoti.regDate),
        new OrderSpecifier<>(Order.DESC, pdRestockNoti.regDate),
        new OrderSpecifier<>(Order.ASC, pdRestockNoti.restockNotiId));
    }

    /* 재입고 알림 수정 */
    @Override
    public int updateSelective(PdRestockNoti entity) {
        if (entity.getRestockNotiId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pdRestockNoti);
        boolean hasAny = false;

        if (entity.getProdId()   != null) { update.set(pdRestockNoti.prodId,   entity.getProdId());   hasAny = true; }
        if (entity.getProdSkuId() != null) { update.set(pdRestockNoti.prodSkuId, entity.getProdSkuId()); hasAny = true; }
        if (entity.getMemberId() != null) { update.set(pdRestockNoti.memberId, entity.getMemberId()); hasAny = true; }
        if (entity.getNotiYn()   != null) { update.set(pdRestockNoti.notiYn,   entity.getNotiYn());   hasAny = true; }
        if (entity.getNotiDate() != null) { update.set(pdRestockNoti.notiDate, entity.getNotiDate()); hasAny = true; }
        if (entity.getUpdBy()    != null) { update.set(pdRestockNoti.updBy,    entity.getUpdBy());    hasAny = true; }
        update.set(pdRestockNoti.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pdRestockNoti.restockNotiId.eq(entity.getRestockNotiId())).execute();
        return (int) affected;
    }
}
