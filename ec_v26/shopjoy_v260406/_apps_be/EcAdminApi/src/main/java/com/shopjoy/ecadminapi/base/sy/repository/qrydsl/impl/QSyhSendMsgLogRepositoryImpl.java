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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhSendMsgLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyhSendMsgLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhSendMsgLogRepositoryImpl implements QSyhSendMsgLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhSendMsgLogRepositoryImpl";
    private static final QSyhSendMsgLog syhSendMsgLog   = QSyhSendMsgLog.syhSendMsgLog;
    private static final QSySite        sySite = QSySite.sySite;
    private static final QSyTemplate    syTemplate = QSyTemplate.syTemplate;
    private static final QSyUser        syUser = QSyUser.syUser;
    private static final QSyCode        cd_mc = new QSyCode("cd_mc");
    private static final QSyCode        cd_sr = new QSyCode("cd_sr");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "send_date", syhSendMsgLog.sendDate,
        "reg_date", syhSendMsgLog.regDate,
        "upd_date", syhSendMsgLog.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("channelCd", syhSendMsgLog.channelCd),
        Map.entry("content", syhSendMsgLog.content),
        Map.entry("deviceToken", syhSendMsgLog.deviceToken),
        Map.entry("failReason", syhSendMsgLog.failReason),
        Map.entry("kakaoTplCode", syhSendMsgLog.kakaoTplCode),
        Map.entry("logId", syhSendMsgLog.logId),
        Map.entry("memberId", syhSendMsgLog.memberId),
        Map.entry("params", syhSendMsgLog.params),
        Map.entry("recvPhone", syhSendMsgLog.recvPhone),
        Map.entry("refId", syhSendMsgLog.refId),
        Map.entry("refTypeCd", syhSendMsgLog.refTypeCd),
        Map.entry("resultCd", syhSendMsgLog.resultCd),
        Map.entry("resultMsg", syhSendMsgLog.resultMsg),
        Map.entry("senderPhone", syhSendMsgLog.senderPhone),
        Map.entry("siteId", syhSendMsgLog.siteId),
        Map.entry("templateCode", syhSendMsgLog.templateCode),
        Map.entry("templateId", syhSendMsgLog.templateId),
        Map.entry("title", syhSendMsgLog.title),
        Map.entry("userId", syhSendMsgLog.userId)
    );

    /* 메시지 발송 로그 baseSelColumnQuery */
    private JPAQuery<SyhSendMsgLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhSendMsgLogDto.Item.class,
                        syhSendMsgLog.logId,
                        syhSendMsgLog.siteId,
                        syhSendMsgLog.channelCd,
                        syhSendMsgLog.templateId,
                        syhSendMsgLog.templateCode,
                        syhSendMsgLog.memberId,
                        syhSendMsgLog.userId,
                        syhSendMsgLog.recvPhone,
                        syhSendMsgLog.deviceToken,
                        syhSendMsgLog.senderPhone,
                        syhSendMsgLog.title,
                        syhSendMsgLog.content,
                        syhSendMsgLog.params,
                        syhSendMsgLog.kakaoTplCode,
                        syhSendMsgLog.resultCd,
                        syhSendMsgLog.resultMsg,
                        syhSendMsgLog.failReason,
                        syhSendMsgLog.sendDate,
                        syhSendMsgLog.refTypeCd,
                        syhSendMsgLog.refId,
                        syhSendMsgLog.regBy,
                        syhSendMsgLog.regDate,
                        syhSendMsgLog.updBy,
                        syhSendMsgLog.updDate,
                        sySite.siteNm.as("siteNm"),
                        syTemplate.templateNm.as("templateNm"),
                        syUser.userNm.as("userNm"),
                        cd_mc.codeLabel.as("channelCdNm"),
                        cd_sr.codeLabel.as("resultCdNm")
                ))
                .from(syhSendMsgLog)
                .leftJoin(sySite).on(sySite.siteId.eq(syhSendMsgLog.siteId))
                .leftJoin(syTemplate).on(syTemplate.templateId.eq(syhSendMsgLog.templateId))
                .leftJoin(syUser).on(syUser.userId.eq(syhSendMsgLog.userId))
                .leftJoin(cd_mc).on(cd_mc.codeGrp.eq("MSG_CHANNEL").and(cd_mc.codeValue.eq(syhSendMsgLog.channelCd)))
                .leftJoin(cd_sr).on(cd_sr.codeGrp.eq("SEND_RESULT").and(cd_sr.codeValue.eq(syhSendMsgLog.resultCd)));
    }

    /* 메시지 발송 로그 키조회 */
    @Override
    public Optional<SyhSendMsgLogDto.Item> selectById(String id) {
        SyhSendMsgLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhSendMsgLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 메시지 발송 로그 목록조회 */
    @Override
    public List<SyhSendMsgLogDto.Item> selectList(SyhSendMsgLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhSendMsgLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(syhSendMsgLog.siteId, search.getSiteId()),
                QdslUtil.strEq(syhSendMsgLog.logId, search.getLogId()),
                QdslUtil.strEq(syhSendMsgLog.userId, search.getUserId()),
                QdslUtil.strEq(syhSendMsgLog.templateId, search.getTemplateId()),
                QdslUtil.strEq(syhSendMsgLog.refTypeCd, search.getTypeCd()),
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

    /* 메시지 발송 로그 페이지조회 */
    @Override
    public SyhSendMsgLogDto.PageResponse selectPageData(SyhSendMsgLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syhSendMsgLog.siteId, search.getSiteId()),
                QdslUtil.strEq(syhSendMsgLog.logId, search.getLogId()),
                QdslUtil.strEq(syhSendMsgLog.userId, search.getUserId()),
                QdslUtil.strEq(syhSendMsgLog.templateId, search.getTemplateId()),
                QdslUtil.strEq(syhSendMsgLog.refTypeCd, search.getTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyhSendMsgLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyhSendMsgLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhSendMsgLog.count())
                .where(wheres)
                .fetchOne();

        SyhSendMsgLogDto.PageResponse res = new SyhSendMsgLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 메시지 발송 로그 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(SyhSendMsgLogDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyhSendMsgLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syhSendMsgLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhSendMsgLog.logId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("logId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhSendMsgLog.logId));
                } else if ("sendDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhSendMsgLog.sendDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhSendMsgLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhSendMsgLog.logId));
        }
        return orders;
    }

    /* 메시지 발송 로그 수정 */
    @Override
    public int updateSelective(SyhSendMsgLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhSendMsgLog);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(syhSendMsgLog.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getChannelCd()    != null) { update.set(syhSendMsgLog.channelCd,    entity.getChannelCd());    hasAny = true; }
        if (entity.getTemplateId()   != null) { update.set(syhSendMsgLog.templateId,   entity.getTemplateId());   hasAny = true; }
        if (entity.getTemplateCode() != null) { update.set(syhSendMsgLog.templateCode, entity.getTemplateCode()); hasAny = true; }
        if (entity.getMemberId()     != null) { update.set(syhSendMsgLog.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getUserId()       != null) { update.set(syhSendMsgLog.userId,       entity.getUserId());       hasAny = true; }
        if (entity.getRecvPhone()    != null) { update.set(syhSendMsgLog.recvPhone,    entity.getRecvPhone());    hasAny = true; }
        if (entity.getDeviceToken()  != null) { update.set(syhSendMsgLog.deviceToken,  entity.getDeviceToken());  hasAny = true; }
        if (entity.getSenderPhone()  != null) { update.set(syhSendMsgLog.senderPhone,  entity.getSenderPhone());  hasAny = true; }
        if (entity.getTitle()        != null) { update.set(syhSendMsgLog.title,        entity.getTitle());        hasAny = true; }
        if (entity.getContent()      != null) { update.set(syhSendMsgLog.content,      entity.getContent());      hasAny = true; }
        if (entity.getParams()       != null) { update.set(syhSendMsgLog.params,       entity.getParams());       hasAny = true; }
        if (entity.getKakaoTplCode() != null) { update.set(syhSendMsgLog.kakaoTplCode, entity.getKakaoTplCode()); hasAny = true; }
        if (entity.getResultCd()     != null) { update.set(syhSendMsgLog.resultCd,     entity.getResultCd());     hasAny = true; }
        if (entity.getResultMsg()    != null) { update.set(syhSendMsgLog.resultMsg,    entity.getResultMsg());    hasAny = true; }
        if (entity.getFailReason()   != null) { update.set(syhSendMsgLog.failReason,   entity.getFailReason());   hasAny = true; }
        if (entity.getSendDate()     != null) { update.set(syhSendMsgLog.sendDate,     entity.getSendDate());     hasAny = true; }
        if (entity.getRefTypeCd()    != null) { update.set(syhSendMsgLog.refTypeCd,    entity.getRefTypeCd());    hasAny = true; }
        if (entity.getRefId()        != null) { update.set(syhSendMsgLog.refId,        entity.getRefId());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syhSendMsgLog.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syhSendMsgLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhSendMsgLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
