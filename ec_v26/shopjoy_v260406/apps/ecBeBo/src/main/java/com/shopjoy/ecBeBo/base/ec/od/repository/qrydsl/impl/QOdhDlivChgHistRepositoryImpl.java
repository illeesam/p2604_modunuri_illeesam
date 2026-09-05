package com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdhDlivChgHistDto;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdhDlivChgHist;
import com.shopjoy.ecBeBo.base.ec.od.data.entity.QOdhDlivChgHist;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdhDlivChgHistRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
/** OdhDlivChgHist(배송 변경 이력) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QOdhDlivChgHistRepositoryImpl implements QOdhDlivChgHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.od.repository.qrydsl.impl.QOdhDlivChgHistRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QOdhDlivChgHist odhDlivChgHist = QOdhDlivChgHist.odhDlivChgHist;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CHG_TYPE (od_dliv 변경유형, sy_code 미등록 — Entity 주석 기준 예시)
     *   COURIER:택배사변경, TRACKING:송장번호변경, RECV_INFO:수령정보변경, MEMO:메모변경, SPLIT:분할, MERGE:병합
     */
    private JPAQuery<OdhDlivChgHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(OdhDlivChgHistDto.Item.class,
                        odhDlivChgHist.dlivChgHistId, // 이력ID (YYMMDDhhmmss+rand4)
                        odhDlivChgHist.dlivId,        // 배송ID
                        odhDlivChgHist.chgTypeCd,     // 변경유형코드 — CHG_TYPE {COURIER:택배사변경, TRACKING:송장번호변경, RECV_INFO:수령정보변경, MEMO:메모변경, SPLIT:분할, MERGE:병합}
                        odhDlivChgHist.chgField,      // 변경 필드명
                        odhDlivChgHist.beforeVal,     // 변경전값
                        odhDlivChgHist.afterVal,      // 변경후값
                        odhDlivChgHist.chgReason,     // 변경사유
                        odhDlivChgHist.chgUserId,     // 처리자 (sy_user.user_id)
                        odhDlivChgHist.chgDate,       // 처리일시
                        odhDlivChgHist.regBy,      // 등록자
                        odhDlivChgHist.regDate,    // 등록일시
                        odhDlivChgHist.updBy,      // 수정자
                        odhDlivChgHist.updDate,    // 수정일시
                        odhDlivChgHist.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(odhDlivChgHist)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(odhDlivChgHist.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(odhDlivChgHist.regBy)) // 등록자
                ;
    }

    /* 배송 변경 이력 키조회 */
    @Override
    public Optional<OdhDlivChgHistDto.Item> selectById(String id) {
        OdhDlivChgHistDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(odhDlivChgHist.dlivChgHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 배송 변경 이력 목록조회 */
    @Override
    public List<OdhDlivChgHistDto.Item> selectList(OdhDlivChgHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhDlivChgHist.dlivChgHistId, search.getDlivChgHistId())); // 이력ID
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<OdhDlivChgHistDto.Item> query = baseSelColumnQuery()
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
        List<OdhDlivChgHistDto.Item> list = query.fetch();
        return list;
    }

    /* 배송 변경 이력 페이지조회 */
    @Override
    public BasePage<OdhDlivChgHistDto.Item> selectPageData(OdhDlivChgHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(odhDlivChgHist.dlivChgHistId, search.getDlivChgHistId())); // 이력ID
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<OdhDlivChgHistDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<OdhDlivChgHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(odhDlivChgHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<OdhDlivChgHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "afterVal,beforeVal,chgField,chgReason,chgTypeCd" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("afterVal", odhDlivChgHist.afterVal), // 변경후값
            QdslUtil.FieldDef.like("beforeVal", odhDlivChgHist.beforeVal), // 변경전값
            QdslUtil.FieldDef.like("chgField", odhDlivChgHist.chgField), // 변경 필드명
            QdslUtil.FieldDef.like("chgReason", odhDlivChgHist.chgReason), // 변경사유
            QdslUtil.FieldDef.like("chgTypeCd", odhDlivChgHist.chgTypeCd), // 변경유형코드 (COURIER/TRACKING/RECV_INFO/MEMO/SPLIT/MERGE)
            QdslUtil.FieldDef.like("chgUserId", odhDlivChgHist.chgUserId), // 처리자 (sy_user.user_id)
            QdslUtil.FieldDef.like("dlivChgHistId", odhDlivChgHist.dlivChgHistId), // 이력ID
            QdslUtil.FieldDef.like("dlivId", odhDlivChgHist.dlivId) // 배송ID
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("dlivChgHistId", odhDlivChgHist.dlivChgHistId,
                   "regDate", odhDlivChgHist.regDate),
        new OrderSpecifier<>(Order.DESC, odhDlivChgHist.regDate),
        new OrderSpecifier<>(Order.ASC, odhDlivChgHist.dlivChgHistId));
    }

    /* 배송 변경 이력 수정 */
    @Override
    public int updateSelective(OdhDlivChgHist entity) {
        if (entity.getDlivChgHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(odhDlivChgHist);
        boolean hasAny = false;

        if (entity.getDlivId()     != null) { update.set(odhDlivChgHist.dlivId,     entity.getDlivId());     hasAny = true; }
        if (entity.getChgTypeCd()  != null) { update.set(odhDlivChgHist.chgTypeCd,  entity.getChgTypeCd());  hasAny = true; }
        if (entity.getChgField()   != null) { update.set(odhDlivChgHist.chgField,   entity.getChgField());   hasAny = true; }
        if (entity.getBeforeVal()  != null) { update.set(odhDlivChgHist.beforeVal,  entity.getBeforeVal());  hasAny = true; }
        if (entity.getAfterVal()   != null) { update.set(odhDlivChgHist.afterVal,   entity.getAfterVal());   hasAny = true; }
        if (entity.getChgReason()  != null) { update.set(odhDlivChgHist.chgReason,  entity.getChgReason());  hasAny = true; }
        if (entity.getChgUserId()  != null) { update.set(odhDlivChgHist.chgUserId,  entity.getChgUserId());  hasAny = true; }
        if (entity.getChgDate()    != null) { update.set(odhDlivChgHist.chgDate,    entity.getChgDate());    hasAny = true; }
        if (entity.getUpdBy()      != null) { update.set(odhDlivChgHist.updBy,      entity.getUpdBy());      hasAny = true; }
        update.set(odhDlivChgHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(odhDlivChgHist.dlivChgHistId.eq(entity.getDlivChgHistId())).execute();
        return (int) affected;
    }
}
