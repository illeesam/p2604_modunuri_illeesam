package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhAlarmSendHist;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhAlarmSendHistRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyhAlarmSendHist QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhAlarmSendHistRepositoryImpl implements QSyhAlarmSendHistRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhAlarmSendHistRepositoryImpl";
    private static final QSyhAlarmSendHist syhAlarmSendHist   = QSyhAlarmSendHist.syhAlarmSendHist;
    private static final QSySite           sySite = QSySite.sySite;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "send_date", syhAlarmSendHist.sendDate,
        "reg_date", syhAlarmSendHist.regDate,
        "upd_date", syhAlarmSendHist.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("alarmId", syhAlarmSendHist.alarmId),
        Map.entry("channel", syhAlarmSendHist.channel),
        Map.entry("errorMsg", syhAlarmSendHist.errorMsg),
        Map.entry("memberId", syhAlarmSendHist.memberId),
        Map.entry("userId", syhAlarmSendHist.userId),
        Map.entry("sendHistId", syhAlarmSendHist.sendHistId),
        Map.entry("sendHistStatusCd", syhAlarmSendHist.sendHistStatusCd),
        Map.entry("sendTo", syhAlarmSendHist.sendTo),
        Map.entry("siteId", syhAlarmSendHist.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * sendHistStatusCd  (sy_code 미등록 — Entity 주석 기준 SENT/FAILED 값 사용)
     */
    /* 알람 발송 이력 baseSelColumnQuery */
    private JPAQuery<SyhAlarmSendHistDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhAlarmSendHistDto.Item.class,
                        syhAlarmSendHist.sendHistId,             // 발송이력ID (PK)
                        syhAlarmSendHist.siteId,                 // 사이트ID (sy_site.site_id)
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
                        sySite.siteNm.as("siteNm")                // 사이트명 (조인: sy_site)
                ))
                .from(syhAlarmSendHist)
                .leftJoin(sySite).on(sySite.siteId.eq(syhAlarmSendHist.siteId));
    }

    /* 알람 발송 이력 키조회 */
    @Override
    public Optional<SyhAlarmSendHistDto.Item> selectById(String id) {
        SyhAlarmSendHistDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhAlarmSendHist.sendHistId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 알람 발송 이력 목록조회 */
    @Override
    public List<SyhAlarmSendHistDto.Item> selectList(SyhAlarmSendHistDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhAlarmSendHistDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syhAlarmSendHist.siteId, search.getSiteId()),
                QdslUtil.strEq(syhAlarmSendHist.sendHistId, search.getSendHistId()),
                QdslUtil.strEq(syhAlarmSendHist.sendHistStatusCd, search.getStatus()),
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

    /* 알람 발송 이력 페이지조회 */
    @Override
    public SyhAlarmSendHistDto.PageResponse selectPageData(SyhAlarmSendHistDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syhAlarmSendHist.siteId, search.getSiteId()),
                QdslUtil.strEq(syhAlarmSendHist.sendHistId, search.getSendHistId()),
                QdslUtil.strEq(syhAlarmSendHist.sendHistStatusCd, search.getStatus()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyhAlarmSendHistDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyhAlarmSendHistDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhAlarmSendHist.count())
                .where(wheres)
                .fetchOne();

        SyhAlarmSendHistDto.PageResponse res = new SyhAlarmSendHistDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(SyhAlarmSendHistDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhAlarmSendHistDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syhAlarmSendHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhAlarmSendHist.sendHistId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("sendHistId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhAlarmSendHist.sendHistId));
                } else if ("sendDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhAlarmSendHist.sendDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhAlarmSendHist.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhAlarmSendHist.sendHistId));
        }
        return orders;
    }

    /* 알람 발송 이력 수정 */
    @Override
    public int updateSelective(SyhAlarmSendHist entity) {
        if (entity.getSendHistId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhAlarmSendHist);
        boolean hasAny = false;

        if (entity.getSiteId()           != null) { update.set(syhAlarmSendHist.siteId,           entity.getSiteId());           hasAny = true; }
        if (entity.getAlarmId()          != null) { update.set(syhAlarmSendHist.alarmId,          entity.getAlarmId());          hasAny = true; }
        if (entity.getMemberId()         != null) { update.set(syhAlarmSendHist.memberId,         entity.getMemberId());         hasAny = true; }
        if (entity.getUserId()           != null) { update.set(syhAlarmSendHist.userId,           entity.getUserId());           hasAny = true; }
        if (entity.getChannel()          != null) { update.set(syhAlarmSendHist.channel,          entity.getChannel());          hasAny = true; }
        if (entity.getSendTo()           != null) { update.set(syhAlarmSendHist.sendTo,           entity.getSendTo());           hasAny = true; }
        if (entity.getSendDate()         != null) { update.set(syhAlarmSendHist.sendDate,         entity.getSendDate());         hasAny = true; }
        if (entity.getSendHistStatusCd() != null) { update.set(syhAlarmSendHist.sendHistStatusCd, entity.getSendHistStatusCd()); hasAny = true; }
        if (entity.getErrorMsg()         != null) { update.set(syhAlarmSendHist.errorMsg,         entity.getErrorMsg());         hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(syhAlarmSendHist.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syhAlarmSendHist.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhAlarmSendHist.sendHistId.eq(entity.getSendHistId())).execute();
        return (int) affected;
    }
}
