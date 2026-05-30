package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
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

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyhSendMsgLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhSendMsgLogRepositoryImpl implements QSyhSendMsgLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final QSyhSendMsgLog l   = QSyhSendMsgLog.syhSendMsgLog;
    private static final QSySite        ste = QSySite.sySite;
    private static final QSyTemplate    tpl = QSyTemplate.syTemplate;
    private static final QSyUser        usr = QSyUser.syUser;
    private static final QSyCode        cd_mc = new QSyCode("cd_mc");
    private static final QSyCode        cd_sr = new QSyCode("cd_sr");

    /* 메시지 발송 로그 buildBaseQuery */
    private JPAQuery<SyhSendMsgLogDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(SyhSendMsgLogDto.Item.class,
                        l.logId,
                        l.siteId,
                        l.channelCd,
                        l.templateId,
                        l.templateCode,
                        l.memberId,
                        l.userId,
                        l.recvPhone,
                        l.deviceToken,
                        l.senderPhone,
                        l.title,
                        l.content,
                        l.params,
                        l.kakaoTplCode,
                        l.resultCd,
                        l.resultMsg,
                        l.failReason,
                        l.sendDate,
                        l.refTypeCd,
                        l.refId,
                        l.regBy,
                        l.regDate,
                        l.updBy,
                        l.updDate,
                        ste.siteNm.as("siteNm"),
                        tpl.templateNm.as("templateNm"),
                        usr.userNm.as("userNm"),
                        cd_mc.codeLabel.as("channelCdNm"),
                        cd_sr.codeLabel.as("resultCdNm")
                ))
                .from(l)
                .leftJoin(ste).on(ste.siteId.eq(l.siteId))
                .leftJoin(tpl).on(tpl.templateId.eq(l.templateId))
                .leftJoin(usr).on(usr.userId.eq(l.userId))
                .leftJoin(cd_mc).on(cd_mc.codeGrp.eq("MSG_CHANNEL").and(cd_mc.codeValue.eq(l.channelCd)))
                .leftJoin(cd_sr).on(cd_sr.codeGrp.eq("SEND_RESULT").and(cd_sr.codeValue.eq(l.resultCd)));
    }

    /* 메시지 발송 로그 키조회 */
    @Override
    public Optional<SyhSendMsgLogDto.Item> selectById(String id) {
        SyhSendMsgLogDto.Item dto = buildBaseQuery()
                .where(l.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 메시지 발송 로그 목록조회 */
    @Override
    public List<SyhSendMsgLogDto.Item> selectList(SyhSendMsgLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhSendMsgLogDto.Item> query = buildBaseQuery().where(
                andSiteId(search),
                andLogId(search),
                andUserId(search),
                andTemplateId(search),
                andTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo   = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /* 메시지 발송 로그 페이지조회 */
    @Override
    public SyhSendMsgLogDto.PageResponse selectPageList(SyhSendMsgLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhSendMsgLogDto.Item> query = buildBaseQuery().where(
                andSiteId(search),
                andLogId(search),
                andUserId(search),
                andTemplateId(search),
                andTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhSendMsgLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(l.count())
                .from(l)
                .where(
                andSiteId(search),
                andLogId(search),
                andUserId(search),
                andTemplateId(search),
                andTypeCd(search),
                andDateRange(search),
                andSearchValue(search)
        )
                .fetchOne();

        SyhSendMsgLogDto.PageResponse res = new SyhSendMsgLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 메시지 발송 로그 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression andSiteId(SyhSendMsgLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? l.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression andLogId(SyhSendMsgLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? l.logId.eq(search.getLogId()) : null;
    }

    /* userId 정확 일치 */
    private BooleanExpression andUserId(SyhSendMsgLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserId())
                ? l.userId.eq(search.getUserId()) : null;
    }

    /* templateId 정확 일치 */
    private BooleanExpression andTemplateId(SyhSendMsgLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getTemplateId())
                ? l.templateId.eq(search.getTemplateId()) : null;
    }

    /* refTypeCd 정확 일치 */
    private BooleanExpression andTypeCd(SyhSendMsgLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? l.refTypeCd.eq(search.getTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression andDateRange(SyhSendMsgLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "send_date": return l.sendDate.goe(start).and(l.sendDate.lt(endExcl));
            case "reg_date": return l.regDate.goe(start).and(l.regDate.lt(endExcl));
            case "upd_date": return l.updDate.goe(start).and(l.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression andSearchValue(SyhSendMsgLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",channelCd,", l.channelCd, pattern);
        or = orLike(or, all, types, ",content,", l.content, pattern);
        or = orLike(or, all, types, ",deviceToken,", l.deviceToken, pattern);
        or = orLike(or, all, types, ",failReason,", l.failReason, pattern);
        or = orLike(or, all, types, ",kakaoTplCode,", l.kakaoTplCode, pattern);
        or = orLike(or, all, types, ",logId,", l.logId, pattern);
        or = orLike(or, all, types, ",memberId,", l.memberId, pattern);
        or = orLike(or, all, types, ",params,", l.params, pattern);
        or = orLike(or, all, types, ",recvPhone,", l.recvPhone, pattern);
        or = orLike(or, all, types, ",refId,", l.refId, pattern);
        or = orLike(or, all, types, ",refTypeCd,", l.refTypeCd, pattern);
        or = orLike(or, all, types, ",resultCd,", l.resultCd, pattern);
        or = orLike(or, all, types, ",resultMsg,", l.resultMsg, pattern);
        or = orLike(or, all, types, ",senderPhone,", l.senderPhone, pattern);
        or = orLike(or, all, types, ",siteId,", l.siteId, pattern);
        or = orLike(or, all, types, ",templateCode,", l.templateCode, pattern);
        or = orLike(or, all, types, ",templateId,", l.templateId, pattern);
        or = orLike(or, all, types, ",title,", l.title, pattern);
        or = orLike(or, all, types, ",userId,", l.userId, pattern);
        return or;
    }

    /* 단일 필드 LIKE 조건을 누적 OR (해당 type 이 포함됐을 때만) */
    private BooleanExpression orLike(BooleanExpression acc, boolean all, String types,
                                     String token, StringPath path, String pattern) {
        if (!(all || types.contains(token))) return acc;
        BooleanExpression expr = path.likeIgnoreCase(pattern);
        return acc == null ? expr : acc.or(expr);
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
            orders.add(new OrderSpecifier(Order.DESC, l.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, l.logId));
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
                    orders.add(new OrderSpecifier(order, l.logId));
                } else if ("sendDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, l.sendDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, l.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, l.logId));
        }
        return orders;
    }

    /* 메시지 발송 로그 수정 */
    @Override
    public int updateSelective(SyhSendMsgLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(l);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(l.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getChannelCd()    != null) { update.set(l.channelCd,    entity.getChannelCd());    hasAny = true; }
        if (entity.getTemplateId()   != null) { update.set(l.templateId,   entity.getTemplateId());   hasAny = true; }
        if (entity.getTemplateCode() != null) { update.set(l.templateCode, entity.getTemplateCode()); hasAny = true; }
        if (entity.getMemberId()     != null) { update.set(l.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getUserId()       != null) { update.set(l.userId,       entity.getUserId());       hasAny = true; }
        if (entity.getRecvPhone()    != null) { update.set(l.recvPhone,    entity.getRecvPhone());    hasAny = true; }
        if (entity.getDeviceToken()  != null) { update.set(l.deviceToken,  entity.getDeviceToken());  hasAny = true; }
        if (entity.getSenderPhone()  != null) { update.set(l.senderPhone,  entity.getSenderPhone());  hasAny = true; }
        if (entity.getTitle()        != null) { update.set(l.title,        entity.getTitle());        hasAny = true; }
        if (entity.getContent()      != null) { update.set(l.content,      entity.getContent());      hasAny = true; }
        if (entity.getParams()       != null) { update.set(l.params,       entity.getParams());       hasAny = true; }
        if (entity.getKakaoTplCode() != null) { update.set(l.kakaoTplCode, entity.getKakaoTplCode()); hasAny = true; }
        if (entity.getResultCd()     != null) { update.set(l.resultCd,     entity.getResultCd());     hasAny = true; }
        if (entity.getResultMsg()    != null) { update.set(l.resultMsg,    entity.getResultMsg());    hasAny = true; }
        if (entity.getFailReason()   != null) { update.set(l.failReason,   entity.getFailReason());   hasAny = true; }
        if (entity.getSendDate()     != null) { update.set(l.sendDate,     entity.getSendDate());     hasAny = true; }
        if (entity.getRefTypeCd()    != null) { update.set(l.refTypeCd,    entity.getRefTypeCd());    hasAny = true; }
        if (entity.getRefId()        != null) { update.set(l.refId,        entity.getRefId());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(l.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(l.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(l.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
