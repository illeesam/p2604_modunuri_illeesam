package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhAlarmSendHist;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhAlarmSendHistRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
/** SyhAlarmSendHist(알림 발송 이력) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhAlarmSendHistRepositoryImpl implements QSyhAlarmSendHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhAlarmSendHistRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QSyhAlarmSendHist syhAlarmSendHist   = QSyhAlarmSendHist.syhAlarmSendHist;    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * sendHistStatusCd  (sy_code 미등록 — Entity 주석 기준 SENT/FAILED 값 사용)
     */
    /* 알람 발송 이력 baseSelColumnQuery */
    private JPAQuery<SyhAlarmSendHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhAlarmSendHistDto.Item.class,
                        syhAlarmSendHist.sendHistId,             // 발송이력ID (PK)
                        syhAlarmSendHist.alarmId,                // 알림ID
                        syhAlarmSendHist.memberId,                // 수신자 회원ID
                        syhAlarmSendHist.userId,                  // 수신자 사용자ID (sy_user.user_id)
                        syhAlarmSendHist.channel,                 // 발송채널
                        syhAlarmSendHist.sendTo,                  // 수신처 (이메일/전화/토큰)
                        syhAlarmSendHist.sendDate,                // 발송일시
                        syhAlarmSendHist.sendHistStatusCd,        // 발송결과 (SENT/FAILED, sy_code 미등록)
                        syhAlarmSendHist.errorMsg,                // 오류메시지
                        syhAlarmSendHist.regBy,                   // 등록자
                        syhAlarmSendHist.regDate,                 // 등록일시
                        syhAlarmSendHist.updBy,                   // 수정자
                        syhAlarmSendHist.updDate,                 // 수정일시
                        syhAlarmSendHist.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(syhAlarmSendHist)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(syhAlarmSendHist.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(syhAlarmSendHist.regBy)) // 등록자
                ;
    }

    /* 알람 발송 이력 키조회 */
    @Override
    public Optional<SyhAlarmSendHistDto.Item> selectById(String id) {
        SyhAlarmSendHistDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhAlarmSendHist.sendHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 알람 발송 이력 목록조회 */
    @Override
    public List<SyhAlarmSendHistDto.Item> selectList(SyhAlarmSendHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhAlarmSendHist.sendHistId, search.getSendHistId())); // 발송이력ID
        whereList.add(QdslUtil.strEq(syhAlarmSendHist.sendHistStatusCd, search.getStatus())); // 상태
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhAlarmSendHist.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhAlarmSendHist.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("send_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhAlarmSendHist.sendDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyhAlarmSendHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyhAlarmSendHistDto.Item> list = query.fetch();
        return list;
    }

    /* 알람 발송 이력 페이지조회 */
    @Override
    public BasePage<SyhAlarmSendHistDto.Item> selectPageData(SyhAlarmSendHistDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhAlarmSendHist.sendHistId, search.getSendHistId())); // 발송이력ID
        whereList.add(QdslUtil.strEq(syhAlarmSendHist.sendHistStatusCd, search.getStatus())); // 상태
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhAlarmSendHist.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhAlarmSendHist.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("send_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhAlarmSendHist.sendDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyhAlarmSendHistDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyhAlarmSendHistDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhAlarmSendHist.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyhAlarmSendHistDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "alarmId,channel,errorMsg,memberId,userId" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("alarmId", syhAlarmSendHist.alarmId), // 알림ID
            QdslUtil.FieldDef.like("channel", syhAlarmSendHist.channel), // 발송채널
            QdslUtil.FieldDef.like("errorMsg", syhAlarmSendHist.errorMsg), // 오류메시지
            QdslUtil.FieldDef.like("memberId", syhAlarmSendHist.memberId), // 수신자 회원ID
            QdslUtil.FieldDef.like("userId", syhAlarmSendHist.userId), // 수신자 사용자ID (sy_user.user_id)
            QdslUtil.FieldDef.like("sendHistId", syhAlarmSendHist.sendHistId), // 발송이력ID
            QdslUtil.FieldDef.like("sendHistStatusCd", syhAlarmSendHist.sendHistStatusCd), // 발송결과 (SENT/FAILED)
            QdslUtil.FieldDef.like("sendTo", syhAlarmSendHist.sendTo) // 수신처 (이메일/전화/토큰)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("sendHistId", syhAlarmSendHist.sendHistId,
                   "sendDate", syhAlarmSendHist.sendDate),
        new OrderSpecifier<>(Order.DESC, syhAlarmSendHist.regDate),
        new OrderSpecifier<>(Order.ASC, syhAlarmSendHist.sendHistId));
    }

    /* 알람 발송 이력 수정 */
    @Override
    public int updateSelective(SyhAlarmSendHist entity) {
        if (entity.getSendHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhAlarmSendHist);
        boolean hasAny = false;

        if (entity.getAlarmId()          != null) { update.set(syhAlarmSendHist.alarmId,          entity.getAlarmId());          hasAny = true; }
        if (entity.getMemberId()         != null) { update.set(syhAlarmSendHist.memberId,         entity.getMemberId());         hasAny = true; }
        if (entity.getUserId()           != null) { update.set(syhAlarmSendHist.userId,           entity.getUserId());           hasAny = true; }
        if (entity.getChannel()          != null) { update.set(syhAlarmSendHist.channel,          entity.getChannel());          hasAny = true; }
        if (entity.getSendTo()           != null) { update.set(syhAlarmSendHist.sendTo,           entity.getSendTo());           hasAny = true; }
        if (entity.getSendDate()         != null) { update.set(syhAlarmSendHist.sendDate,         entity.getSendDate());         hasAny = true; }
        if (entity.getSendHistStatusCd() != null) { update.set(syhAlarmSendHist.sendHistStatusCd, entity.getSendHistStatusCd()); hasAny = true; }
        if (entity.getErrorMsg()         != null) { update.set(syhAlarmSendHist.errorMsg,         entity.getErrorMsg());         hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(syhAlarmSendHist.updBy,            entity.getUpdBy());            hasAny = true; }
        update.set(syhAlarmSendHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhAlarmSendHist.sendHistId.eq(entity.getSendHistId())).execute();
        return (int) affected;
    }
}
