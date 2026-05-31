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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhSendEmailLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
/** SyhSendEmailLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhSendEmailLogRepositoryImpl implements QSyhSendEmailLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhSendEmailLogRepositoryImpl";
    private static final QSyhSendEmailLog a   = QSyhSendEmailLog.syhSendEmailLog;
    private static final QSySite          ste = QSySite.sySite;
    private static final QSyTemplate      tpl = QSyTemplate.syTemplate;
    private static final QSyUser          usr = QSyUser.syUser;
    private static final QSyCode          cd_sr = new QSyCode("cd_sr");

    /* 이메일 발송 로그 baseSelColumnQuery */
    private JPAQuery<SyhSendEmailLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhSendEmailLogDto.Item.class,
                        a.logId,
                        a.siteId,
                        a.templateId,
                        a.templateCode,
                        a.memberId,
                        a.userId,
                        a.fromAddr,
                        a.toAddr,
                        a.ccAddr,
                        a.bccAddr,
                        a.subject,
                        a.content,
                        a.params,
                        a.resultCd,
                        a.failReason,
                        a.sendDate,
                        a.refTypeCd,
                        a.refId,
                        a.regBy,
                        a.regDate,
                        a.updBy,
                        a.updDate,
                        ste.siteNm.as("siteNm"),
                        tpl.templateNm.as("templateNm"),
                        usr.userNm.as("userNm"),
                        cd_sr.codeLabel.as("resultCdNm")
                ))
                .from(a)
                .leftJoin(ste).on(ste.siteId.eq(a.siteId))
                .leftJoin(tpl).on(tpl.templateId.eq(a.templateId))
                .leftJoin(usr).on(usr.userId.eq(a.userId))
                .leftJoin(cd_sr).on(cd_sr.codeGrp.eq("SEND_RESULT").and(cd_sr.codeValue.eq(a.resultCd)));
    }

    /* 이메일 발송 로그 키조회 */
    @Override
    public Optional<SyhSendEmailLogDto.Item> selectById(String id) {
        SyhSendEmailLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(a.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 이메일 발송 로그 목록조회 */
    @Override
    public List<SyhSendEmailLogDto.Item> selectList(SyhSendEmailLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhSendEmailLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndUserId(search),
                baseAndTemplateId(search),
                baseAndTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
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

    /* 이메일 발송 로그 페이지조회 */
    @Override
    public SyhSendEmailLogDto.PageResponse selectPageList(SyhSendEmailLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<SyhSendEmailLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageList() :: list").where(
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndUserId(search),
                baseAndTemplateId(search),
                baseAndTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        );
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhSendEmailLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(a.count())
                .from(a)
                .where(
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndUserId(search),
                baseAndTemplateId(search),
                baseAndTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        )
                .fetchOne();

        SyhSendEmailLogDto.PageResponse res = new SyhSendEmailLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* 이메일 발송 로그 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(baseAndSiteId(s), andDeptId(s), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* siteId 정확 일치 */
    private BooleanExpression baseAndSiteId(SyhSendEmailLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getSiteId())
                ? a.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression baseAndLogId(SyhSendEmailLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? a.logId.eq(search.getLogId()) : null;
    }

    /* userId 정확 일치 */
    private BooleanExpression baseAndUserId(SyhSendEmailLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserId())
                ? a.userId.eq(search.getUserId()) : null;
    }

    /* templateId 정확 일치 */
    private BooleanExpression baseAndTemplateId(SyhSendEmailLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getTemplateId())
                ? a.templateId.eq(search.getTemplateId()) : null;
    }

    /* refTypeCd 정확 일치 */
    private BooleanExpression baseAndTypeCd(SyhSendEmailLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? a.refTypeCd.eq(search.getTypeCd()) : null;
    }

    /* 기간 — dateType + dateStart + dateEnd (yyyy-MM-dd, 끝일 포함) */
    private BooleanExpression baseAndDateRange(SyhSendEmailLogDto.Request search) {
        if (search == null
                || !StringUtils.hasText(search.getDateType())
                || !StringUtils.hasText(search.getDateStart())
                || !StringUtils.hasText(search.getDateEnd())) return null;
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDateTime start   = LocalDate.parse(search.getDateStart(), fmt).atStartOfDay();
        LocalDateTime endExcl = LocalDate.parse(search.getDateEnd(),   fmt).plusDays(1).atStartOfDay();
        switch (search.getDateType()) {
            case "send_date": return a.sendDate.goe(start).and(a.sendDate.lt(endExcl));
            case "reg_date": return a.regDate.goe(start).and(a.regDate.lt(endExcl));
            case "upd_date": return a.updDate.goe(start).and(a.updDate.lt(endExcl));
            default: return null;
        }
    }

    /* searchValue LIKE OR — searchType csv 분기 (없으면 전체 필드) */
    private BooleanExpression baseAndSearchValue(SyhSendEmailLogDto.Request search) {
        if (search == null || !StringUtils.hasText(search.getSearchValue())) return null;
        String pattern = "%" + search.getSearchValue() + "%";
        String typeRaw = search.getSearchType();
        boolean all = !StringUtils.hasText(typeRaw);
        String types = all ? "" : ("," + typeRaw.trim() + ",");
        BooleanExpression or = null;
        or = orLike(or, all, types, ",bccAddr,", a.bccAddr, pattern);
        or = orLike(or, all, types, ",ccAddr,", a.ccAddr, pattern);
        or = orLike(or, all, types, ",content,", a.content, pattern);
        or = orLike(or, all, types, ",failReason,", a.failReason, pattern);
        or = orLike(or, all, types, ",fromAddr,", a.fromAddr, pattern);
        or = orLike(or, all, types, ",logId,", a.logId, pattern);
        or = orLike(or, all, types, ",memberId,", a.memberId, pattern);
        or = orLike(or, all, types, ",params,", a.params, pattern);
        or = orLike(or, all, types, ",refId,", a.refId, pattern);
        or = orLike(or, all, types, ",refTypeCd,", a.refTypeCd, pattern);
        or = orLike(or, all, types, ",resultCd,", a.resultCd, pattern);
        or = orLike(or, all, types, ",siteId,", a.siteId, pattern);
        or = orLike(or, all, types, ",subject,", a.subject, pattern);
        or = orLike(or, all, types, ",templateCode,", a.templateCode, pattern);
        or = orLike(or, all, types, ",templateId,", a.templateId, pattern);
        or = orLike(or, all, types, ",toAddr,", a.toAddr, pattern);
        or = orLike(or, all, types, ",userId,", a.userId, pattern);
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
    private List<OrderSpecifier<?>> buildOrder(SyhSendEmailLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.logId));
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
                    orders.add(new OrderSpecifier(order, a.logId));
                } else if ("sendDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, a.sendDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, a.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, a.logId));
        }
        return orders;
    }

    /* 이메일 발송 로그 수정 */
    @Override
    public int updateSelective(SyhSendEmailLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(a);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(a.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getTemplateId()   != null) { update.set(a.templateId,   entity.getTemplateId());   hasAny = true; }
        if (entity.getTemplateCode() != null) { update.set(a.templateCode, entity.getTemplateCode()); hasAny = true; }
        if (entity.getMemberId()     != null) { update.set(a.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getUserId()       != null) { update.set(a.userId,       entity.getUserId());       hasAny = true; }
        if (entity.getFromAddr()     != null) { update.set(a.fromAddr,     entity.getFromAddr());     hasAny = true; }
        if (entity.getToAddr()       != null) { update.set(a.toAddr,       entity.getToAddr());       hasAny = true; }
        if (entity.getCcAddr()       != null) { update.set(a.ccAddr,       entity.getCcAddr());       hasAny = true; }
        if (entity.getBccAddr()      != null) { update.set(a.bccAddr,      entity.getBccAddr());      hasAny = true; }
        if (entity.getSubject()      != null) { update.set(a.subject,      entity.getSubject());      hasAny = true; }
        if (entity.getContent()      != null) { update.set(a.content,      entity.getContent());      hasAny = true; }
        if (entity.getParams()       != null) { update.set(a.params,       entity.getParams());       hasAny = true; }
        if (entity.getResultCd()     != null) { update.set(a.resultCd,     entity.getResultCd());     hasAny = true; }
        if (entity.getFailReason()   != null) { update.set(a.failReason,   entity.getFailReason());   hasAny = true; }
        if (entity.getSendDate()     != null) { update.set(a.sendDate,     entity.getSendDate());     hasAny = true; }
        if (entity.getRefTypeCd()    != null) { update.set(a.refTypeCd,    entity.getRefTypeCd());    hasAny = true; }
        if (entity.getRefId()        != null) { update.set(a.refId,        entity.getRefId());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(a.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(a.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(a.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
