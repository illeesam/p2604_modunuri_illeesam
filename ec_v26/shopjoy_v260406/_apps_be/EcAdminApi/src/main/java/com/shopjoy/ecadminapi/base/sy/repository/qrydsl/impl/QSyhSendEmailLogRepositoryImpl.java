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
    private static final QSyhSendEmailLog syhSendEmailLog   = QSyhSendEmailLog.syhSendEmailLog;
    private static final QSySite          sySite = QSySite.sySite;
    private static final QSyTemplate      syTemplate = QSyTemplate.syTemplate;
    private static final QSyUser          syUser = QSyUser.syUser;
    private static final QSyCode          cd_sr = new QSyCode("cd_sr");

    /* 이메일 발송 로그 baseSelColumnQuery */
    private JPAQuery<SyhSendEmailLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhSendEmailLogDto.Item.class,
                        syhSendEmailLog.logId,
                        syhSendEmailLog.siteId,
                        syhSendEmailLog.templateId,
                        syhSendEmailLog.templateCode,
                        syhSendEmailLog.memberId,
                        syhSendEmailLog.userId,
                        syhSendEmailLog.fromAddr,
                        syhSendEmailLog.toAddr,
                        syhSendEmailLog.ccAddr,
                        syhSendEmailLog.bccAddr,
                        syhSendEmailLog.subject,
                        syhSendEmailLog.content,
                        syhSendEmailLog.params,
                        syhSendEmailLog.resultCd,
                        syhSendEmailLog.failReason,
                        syhSendEmailLog.sendDate,
                        syhSendEmailLog.refTypeCd,
                        syhSendEmailLog.refId,
                        syhSendEmailLog.regBy,
                        syhSendEmailLog.regDate,
                        syhSendEmailLog.updBy,
                        syhSendEmailLog.updDate,
                        sySite.siteNm.as("siteNm"),
                        syTemplate.templateNm.as("templateNm"),
                        syUser.userNm.as("userNm"),
                        cd_sr.codeLabel.as("resultCdNm")
                ))
                .from(syhSendEmailLog)
                .leftJoin(sySite).on(sySite.siteId.eq(syhSendEmailLog.siteId))
                .leftJoin(syTemplate).on(syTemplate.templateId.eq(syhSendEmailLog.templateId))
                .leftJoin(syUser).on(syUser.userId.eq(syhSendEmailLog.userId))
                .leftJoin(cd_sr).on(cd_sr.codeGrp.eq("SEND_RESULT").and(cd_sr.codeValue.eq(syhSendEmailLog.resultCd)));
    }

    /* 이메일 발송 로그 키조회 */
    @Override
    public Optional<SyhSendEmailLogDto.Item> selectById(String id) {
        SyhSendEmailLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhSendEmailLog.logId.eq(id))
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
    public SyhSendEmailLogDto.PageResponse selectPageData(SyhSendEmailLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                baseAndSiteId(search),
                baseAndLogId(search),
                baseAndUserId(search),
                baseAndTemplateId(search),
                baseAndTypeCd(search),
                baseAndDateRange(search),
                baseAndSearchValue(search)
        };

        JPAQuery<SyhSendEmailLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list").where(wheres);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<SyhSendEmailLogDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(syhSendEmailLog.count())
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt").from(syhSendEmailLog)
                .where(wheres)
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
                ? syhSendEmailLog.siteId.eq(search.getSiteId()) : null;
    }

    /* logId 정확 일치 */
    private BooleanExpression baseAndLogId(SyhSendEmailLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getLogId())
                ? syhSendEmailLog.logId.eq(search.getLogId()) : null;
    }

    /* userId 정확 일치 */
    private BooleanExpression baseAndUserId(SyhSendEmailLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getUserId())
                ? syhSendEmailLog.userId.eq(search.getUserId()) : null;
    }

    /* templateId 정확 일치 */
    private BooleanExpression baseAndTemplateId(SyhSendEmailLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getTemplateId())
                ? syhSendEmailLog.templateId.eq(search.getTemplateId()) : null;
    }

    /* refTypeCd 정확 일치 */
    private BooleanExpression baseAndTypeCd(SyhSendEmailLogDto.Request search) {
        return search != null && StringUtils.hasText(search.getTypeCd())
                ? syhSendEmailLog.refTypeCd.eq(search.getTypeCd()) : null;
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
            case "send_date": return syhSendEmailLog.sendDate.goe(start).and(syhSendEmailLog.sendDate.lt(endExcl));
            case "reg_date": return syhSendEmailLog.regDate.goe(start).and(syhSendEmailLog.regDate.lt(endExcl));
            case "upd_date": return syhSendEmailLog.updDate.goe(start).and(syhSendEmailLog.updDate.lt(endExcl));
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
        or = orLike(or, all, types, ",bccAddr,", syhSendEmailLog.bccAddr, pattern);
        or = orLike(or, all, types, ",ccAddr,", syhSendEmailLog.ccAddr, pattern);
        or = orLike(or, all, types, ",content,", syhSendEmailLog.content, pattern);
        or = orLike(or, all, types, ",failReason,", syhSendEmailLog.failReason, pattern);
        or = orLike(or, all, types, ",fromAddr,", syhSendEmailLog.fromAddr, pattern);
        or = orLike(or, all, types, ",logId,", syhSendEmailLog.logId, pattern);
        or = orLike(or, all, types, ",memberId,", syhSendEmailLog.memberId, pattern);
        or = orLike(or, all, types, ",params,", syhSendEmailLog.params, pattern);
        or = orLike(or, all, types, ",refId,", syhSendEmailLog.refId, pattern);
        or = orLike(or, all, types, ",refTypeCd,", syhSendEmailLog.refTypeCd, pattern);
        or = orLike(or, all, types, ",resultCd,", syhSendEmailLog.resultCd, pattern);
        or = orLike(or, all, types, ",siteId,", syhSendEmailLog.siteId, pattern);
        or = orLike(or, all, types, ",subject,", syhSendEmailLog.subject, pattern);
        or = orLike(or, all, types, ",templateCode,", syhSendEmailLog.templateCode, pattern);
        or = orLike(or, all, types, ",templateId,", syhSendEmailLog.templateId, pattern);
        or = orLike(or, all, types, ",toAddr,", syhSendEmailLog.toAddr, pattern);
        or = orLike(or, all, types, ",userId,", syhSendEmailLog.userId, pattern);
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
            orders.add(new OrderSpecifier(Order.DESC, syhSendEmailLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhSendEmailLog.logId));
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
                    orders.add(new OrderSpecifier(order, syhSendEmailLog.logId));
                } else if ("sendDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syhSendEmailLog.sendDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syhSendEmailLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syhSendEmailLog.logId));
        }
        return orders;
    }

    /* 이메일 발송 로그 수정 */
    @Override
    public int updateSelective(SyhSendEmailLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhSendEmailLog);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(syhSendEmailLog.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getTemplateId()   != null) { update.set(syhSendEmailLog.templateId,   entity.getTemplateId());   hasAny = true; }
        if (entity.getTemplateCode() != null) { update.set(syhSendEmailLog.templateCode, entity.getTemplateCode()); hasAny = true; }
        if (entity.getMemberId()     != null) { update.set(syhSendEmailLog.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getUserId()       != null) { update.set(syhSendEmailLog.userId,       entity.getUserId());       hasAny = true; }
        if (entity.getFromAddr()     != null) { update.set(syhSendEmailLog.fromAddr,     entity.getFromAddr());     hasAny = true; }
        if (entity.getToAddr()       != null) { update.set(syhSendEmailLog.toAddr,       entity.getToAddr());       hasAny = true; }
        if (entity.getCcAddr()       != null) { update.set(syhSendEmailLog.ccAddr,       entity.getCcAddr());       hasAny = true; }
        if (entity.getBccAddr()      != null) { update.set(syhSendEmailLog.bccAddr,      entity.getBccAddr());      hasAny = true; }
        if (entity.getSubject()      != null) { update.set(syhSendEmailLog.subject,      entity.getSubject());      hasAny = true; }
        if (entity.getContent()      != null) { update.set(syhSendEmailLog.content,      entity.getContent());      hasAny = true; }
        if (entity.getParams()       != null) { update.set(syhSendEmailLog.params,       entity.getParams());       hasAny = true; }
        if (entity.getResultCd()     != null) { update.set(syhSendEmailLog.resultCd,     entity.getResultCd());     hasAny = true; }
        if (entity.getFailReason()   != null) { update.set(syhSendEmailLog.failReason,   entity.getFailReason());   hasAny = true; }
        if (entity.getSendDate()     != null) { update.set(syhSendEmailLog.sendDate,     entity.getSendDate());     hasAny = true; }
        if (entity.getRefTypeCd()    != null) { update.set(syhSendEmailLog.refTypeCd,    entity.getRefTypeCd());    hasAny = true; }
        if (entity.getRefId()        != null) { update.set(syhSendEmailLog.refId,        entity.getRefId());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syhSendEmailLog.updBy,        entity.getUpdBy());        hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syhSendEmailLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhSendEmailLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
