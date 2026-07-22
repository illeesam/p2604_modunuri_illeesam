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

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
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
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "send_date", syhSendEmailLog.sendDate,
        "reg_date", syhSendEmailLog.regDate,
        "upd_date", syhSendEmailLog.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("bccAddr", syhSendEmailLog.bccAddr),
        Map.entry("ccAddr", syhSendEmailLog.ccAddr),
        Map.entry("content", syhSendEmailLog.content),
        Map.entry("failReason", syhSendEmailLog.failReason),
        Map.entry("fromAddr", syhSendEmailLog.fromAddr),
        Map.entry("logId", syhSendEmailLog.logId),
        Map.entry("memberId", syhSendEmailLog.memberId),
        Map.entry("params", syhSendEmailLog.params),
        Map.entry("refId", syhSendEmailLog.refId),
        Map.entry("refTypeCd", syhSendEmailLog.refTypeCd),
        Map.entry("resultCd", syhSendEmailLog.resultCd),
        Map.entry("siteId", syhSendEmailLog.siteId),
        Map.entry("subject", syhSendEmailLog.subject),
        Map.entry("templateCode", syhSendEmailLog.templateCode),
        Map.entry("templateId", syhSendEmailLog.templateId),
        Map.entry("toAddr", syhSendEmailLog.toAddr),
        Map.entry("userId", syhSendEmailLog.userId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * SEND_RESULT  {SUCCESS: '성공', FAILED: '실패', PENDING: '대기'}
     */
    /* 이메일 발송 로그 baseSelColumnQuery */
    private JPAQuery<SyhSendEmailLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhSendEmailLogDto.Item.class,
                        syhSendEmailLog.logId,           // 로그ID (PK, YYMMDDhhmmss+rand4)
                        syhSendEmailLog.siteId,          // 사이트ID (sy_site.site_id)
                        syhSendEmailLog.templateId,      // 템플릿ID (sy_template.template_id)
                        syhSendEmailLog.templateCode,    // 템플릿코드 스냅샷
                        syhSendEmailLog.memberId,        // 대상 회원ID (ec_member.member_id, 비회원 NULL)
                        syhSendEmailLog.userId,          // 대상 관리자ID (sy_user.user_id, 관리자 발송 시)
                        syhSendEmailLog.fromAddr,        // 발신 이메일
                        syhSendEmailLog.toAddr,          // 수신 이메일
                        syhSendEmailLog.ccAddr,          // 참조 이메일 (복수 시 콤마 구분)
                        syhSendEmailLog.bccAddr,         // 숨은참조 이메일
                        syhSendEmailLog.subject,         // 발송 제목 (치환 완료본)
                        syhSendEmailLog.content,         // 발송 본문 (치환 완료본 HTML)
                        syhSendEmailLog.params,          // 치환 파라미터 JSON
                        syhSendEmailLog.resultCd,        // 발송결과 — SEND_RESULT {SUCCESS: '성공', FAILED: '실패', PENDING: '대기'}
                        syhSendEmailLog.failReason,      // 실패 사유
                        syhSendEmailLog.sendDate,        // 발송일시
                        syhSendEmailLog.refTypeCd,       // 연관유형코드 (ORDER/CLAIM/JOIN/PWD_RESET 등)
                        syhSendEmailLog.refId,           // 연관ID
                        syhSendEmailLog.regBy,           // 등록자
                        syhSendEmailLog.regDate,         // 등록일시
                        syhSendEmailLog.updBy,           // 수정자
                        syhSendEmailLog.updDate,         // 수정일시
                        sySite.siteNm.as("siteNm"),                  // 사이트명 (조인: sy_site)
                        syTemplate.templateNm.as("templateNm"),      // 템플릿명 (조인: sy_template)
                        syUser.userNm.as("userNm"),                  // 관리자명 (조인: sy_user)
                        cd_sr.codeLabel.as("resultCdNm")              // 발송결과 코드명 (조인: sy_code SEND_RESULT)
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
                QdslUtil.strEq(syhSendEmailLog.siteId, search.getSiteId()),
                QdslUtil.strEq(syhSendEmailLog.logId, search.getLogId()),
                QdslUtil.strEq(syhSendEmailLog.userId, search.getUserId()),
                QdslUtil.strEq(syhSendEmailLog.templateId, search.getTemplateId()),
                QdslUtil.strEq(syhSendEmailLog.refTypeCd, search.getTypeCd()),
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

    /* 이메일 발송 로그 페이지조회 */
    @Override
    public SyhSendEmailLogDto.PageResponse selectPageData(SyhSendEmailLogDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syhSendEmailLog.siteId, search.getSiteId()),
                QdslUtil.strEq(syhSendEmailLog.logId, search.getLogId()),
                QdslUtil.strEq(syhSendEmailLog.userId, search.getUserId()),
                QdslUtil.strEq(syhSendEmailLog.templateId, search.getTemplateId()),
                QdslUtil.strEq(syhSendEmailLog.refTypeCd, search.getTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyhSendEmailLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyhSendEmailLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhSendEmailLog.count())
                .where(wheres)
                .fetchOne();

        SyhSendEmailLogDto.PageResponse res = new SyhSendEmailLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(SyhSendEmailLogDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
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
