package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbDeviceTokenRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbDeviceTokenRepositoryImpl implements QMbDeviceTokenRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbDeviceTokenRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QMbDeviceToken mbDeviceToken   = QMbDeviceToken.mbDeviceToken;
    private static final QMbMember      mbMember = QMbMember.mbMember;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * OS_TYPE          ANDROID/IOS (코드 미등록, DDL 코멘트 기준 값)
     * BENEFIT_NOTI_YN  {Y: '수신', N: '미수신'}
     */
    private JPAQuery<MbDeviceTokenDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbDeviceTokenDto.Item.class,
                        mbDeviceToken.deviceTokenId,   // 디바이스 토큰ID (PK)
                        mbDeviceToken.deviceToken,     // 디바이스 토큰 키
                        mbDeviceToken.memberId,        // 회원ID (mb_member.member_id, 비회원 가능)
                        mbDeviceToken.osTypeCd,          // OS유형 — ANDROID/IOS
                        mbDeviceToken.benefitNotiYn,   // 혜택알림수신여부 — BENEFIT_NOTI_YN {Y: '수신', N: '미수신'}
                        mbDeviceToken.alimReadDate,    // 알림리스트 읽음일시
                        mbDeviceToken.regBy,           // 등록자
                        mbDeviceToken.regDate,         // 등록일시
                        mbDeviceToken.updBy,           // 수정자
                        mbDeviceToken.updDate,         // 수정일시
                        mbMember.memberNm.as("memberNm"),   // 회원명 (mb_member 조인)
                        mbDeviceToken.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        mbDeviceToken.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(mbDeviceToken)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbDeviceToken.memberId)) // 회원
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(mbDeviceToken.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(mbDeviceToken.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(mbDeviceToken.siteId)) // 사이트

                ;
    }

    /* 키조회 */
    @Override
    public Optional<MbDeviceTokenDto.Item> selectById(String deviceTokenId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbDeviceToken.deviceTokenId.eq(deviceTokenId)).fetchOne());
    }

    /* 목록조회 */
    @Override
    public List<MbDeviceTokenDto.Item> selectList(MbDeviceTokenDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mbDeviceToken.deviceTokenId, search.getDeviceTokenId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbDeviceToken.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbDeviceToken.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mbDeviceToken.siteId, search.getSiteId()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MbDeviceTokenDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<MbDeviceTokenDto.Item> list = query.fetch();
        return list;
    }

    /* 페이지조회 */
    @Override
    public BasePage<MbDeviceTokenDto.Item> selectPageData(MbDeviceTokenDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mbDeviceToken.deviceTokenId, search.getDeviceTokenId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbDeviceToken.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbDeviceToken.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mbDeviceToken.siteId, search.getSiteId()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<MbDeviceTokenDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MbDeviceTokenDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbDeviceToken.count())
                .where(wheres)
                .fetchOne();

        BasePage<MbDeviceTokenDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("benefitNotiYn", mbDeviceToken.benefitNotiYn),
            QdslUtil.FieldDef.like("deviceToken", mbDeviceToken.deviceToken),
            QdslUtil.FieldDef.like("deviceTokenId", mbDeviceToken.deviceTokenId),
            QdslUtil.FieldDef.like("memberId", mbDeviceToken.memberId),
            QdslUtil.FieldDef.like("osTypeCd", mbDeviceToken.osTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("deviceTokenId", mbDeviceToken.deviceTokenId,
                   "regDate", mbDeviceToken.regDate),
        new OrderSpecifier<>(Order.DESC, mbDeviceToken.regDate),
        new OrderSpecifier<>(Order.ASC, mbDeviceToken.deviceTokenId));
    }

    /* 수정 */
    @Override
    public int updateSelective(MbDeviceToken entity) {
        if (entity.getDeviceTokenId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbDeviceToken);
        boolean hasAny = false;
        if (entity.getDeviceToken()   != null) { update.set(mbDeviceToken.deviceToken,   entity.getDeviceToken());   hasAny = true; }
        if (entity.getMemberId()      != null) { update.set(mbDeviceToken.memberId,      entity.getMemberId());      hasAny = true; }
        if (entity.getOsTypeCd()        != null) { update.set(mbDeviceToken.osTypeCd,        entity.getOsTypeCd());        hasAny = true; }
        if (entity.getBenefitNotiYn() != null) { update.set(mbDeviceToken.benefitNotiYn, entity.getBenefitNotiYn()); hasAny = true; }
        if (entity.getAlimReadDate()  != null) { update.set(mbDeviceToken.alimReadDate,  entity.getAlimReadDate());  hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(mbDeviceToken.updBy,         entity.getUpdBy());         hasAny = true; }
        update.set(mbDeviceToken.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbDeviceToken.deviceTokenId.eq(entity.getDeviceTokenId())).execute();
    }
}
