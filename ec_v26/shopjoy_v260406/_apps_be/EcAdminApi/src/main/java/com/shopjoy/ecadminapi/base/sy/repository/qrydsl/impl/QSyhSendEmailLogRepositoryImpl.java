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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendEmailLogDto;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendEmailLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhSendEmailLogRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyhSendEmailLog(이메일 발송 로그) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhSendEmailLogRepositoryImpl implements QSyhSendEmailLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhSendEmailLogRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QSyhSendEmailLog syhSendEmailLog   = QSyhSendEmailLog.syhSendEmailLog;
    private static final QSySite          sySite = QSySite.sySite;
    private static final QSyTemplate      syTemplate = QSyTemplate.syTemplate;
    private static final QSyUser          syUser = QSyUser.syUser;
    private static final QVwSyCode          codeResultCd = new QVwSyCode("codeResultCd");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * SEND_RESULT  {SUCCESS: '성공', FAILED: '실패', PENDING: '대기'}
     */
    /* 이메일 발송 로그 baseSelColumnQuery */
    private JPAQuery<SyhSendEmailLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhSendEmailLogDto.Item.class,
                        syhSendEmailLog.logId,           // 로그ID (PK, YYMMDDhhmmss+rand4)
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
                        syTemplate.templateNm.as("templateNm"),      // 템플릿명 (조인: sy_template)
                        syUser.userNm.as("userNm"),                  // 관리자명 (조인: sy_user)
                        codeResultCd.codeLabel.as("resultCdNm"),              // 발송결과 코드명 (조인: sy_code SEND_RESULT)
                        syhSendEmailLog.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(syhSendEmailLog)
                .leftJoin(syTemplate).on(syTemplate.templateId.eq(syhSendEmailLog.templateId)) // 템플릿
                .leftJoin(syUser).on(syUser.userId.eq(syhSendEmailLog.userId)) // 사용자
                .leftJoin(codeResultCd).on(codeResultCd.codeGrp.eq("SEND_RESULT").and(codeResultCd.codeValue.eq(syhSendEmailLog.resultCd))) // 발송결과
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(syhSendEmailLog.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(syhSendEmailLog.regBy)) // 등록자
                ;
    }

    /* 이메일 발송 로그 키조회 */
    @Override
    public Optional<SyhSendEmailLogDto.Item> selectById(String id) {
        SyhSendEmailLogDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhSendEmailLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 이메일 발송 로그 목록조회 */
    @Override
    public List<SyhSendEmailLogDto.Item> selectList(SyhSendEmailLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhSendEmailLog.logId, search.getLogId())); // 로그ID (YYMMDDhhmmss+rand4)
        whereList.add(QdslUtil.strEq(syhSendEmailLog.userId, search.getUserId())); // 대상 관리자ID (sy_user.user_id, 관리자 발송 시)
        whereList.add(QdslUtil.strEq(syhSendEmailLog.templateId, search.getTemplateId())); // 템플릿ID (sy_template.template_id)
        whereList.add(QdslUtil.strEq(syhSendEmailLog.refTypeCd, search.getTypeCd())); // 유형코드
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendEmailLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendEmailLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("send_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendEmailLog.sendDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyhSendEmailLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyhSendEmailLogDto.Item> list = query.fetch();
        return list;
    }

    /* 이메일 발송 로그 페이지조회 */
    @Override
    public BasePage<SyhSendEmailLogDto.Item> selectPageData(SyhSendEmailLogDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhSendEmailLog.logId, search.getLogId())); // 로그ID (YYMMDDhhmmss+rand4)
        whereList.add(QdslUtil.strEq(syhSendEmailLog.userId, search.getUserId())); // 대상 관리자ID (sy_user.user_id, 관리자 발송 시)
        whereList.add(QdslUtil.strEq(syhSendEmailLog.templateId, search.getTemplateId())); // 템플릿ID (sy_template.template_id)
        whereList.add(QdslUtil.strEq(syhSendEmailLog.refTypeCd, search.getTypeCd())); // 유형코드
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendEmailLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendEmailLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("send_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendEmailLog.sendDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyhSendEmailLogDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyhSendEmailLogDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhSendEmailLog.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyhSendEmailLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "bccAddr,ccAddr,content,failReason,fromAddr" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("bccAddr", syhSendEmailLog.bccAddr), // 숨은참조 이메일
            QdslUtil.FieldDef.like("ccAddr", syhSendEmailLog.ccAddr), // 참조 이메일 (복수 시 콤마 구분)
            QdslUtil.FieldDef.like("content", syhSendEmailLog.content), // 발송 본문 (치환 완료본 HTML)
            QdslUtil.FieldDef.like("failReason", syhSendEmailLog.failReason), // 실패 사유
            QdslUtil.FieldDef.like("fromAddr", syhSendEmailLog.fromAddr), // 발신 이메일
            QdslUtil.FieldDef.like("logId", syhSendEmailLog.logId), // 로그ID (YYMMDDhhmmss+rand4)
            QdslUtil.FieldDef.like("memberId", syhSendEmailLog.memberId), // 대상 회원ID (ec_member.member_id, 비회원 NULL)
            QdslUtil.FieldDef.like("params", syhSendEmailLog.params), // 치환 파라미터 JSON (예: {"order_no":"...","member_nm":"..."})
            QdslUtil.FieldDef.like("refId", syhSendEmailLog.refId), // 연관ID
            QdslUtil.FieldDef.like("refTypeCd", syhSendEmailLog.refTypeCd), // 연관유형코드 (ORDER/CLAIM/JOIN/PWD_RESET 등)
            QdslUtil.FieldDef.like("resultCd", syhSendEmailLog.resultCd), // 발송결과 (코드: SEND_RESULT)
            QdslUtil.FieldDef.like("subject", syhSendEmailLog.subject), // 발송 제목 (치환 완료본)
            QdslUtil.FieldDef.like("templateCode", syhSendEmailLog.templateCode), // 템플릿코드 스냅샷
            QdslUtil.FieldDef.like("templateId", syhSendEmailLog.templateId), // 템플릿ID (sy_template.template_id)
            QdslUtil.FieldDef.like("toAddr", syhSendEmailLog.toAddr), // 수신 이메일
            QdslUtil.FieldDef.like("userId", syhSendEmailLog.userId) // 대상 관리자ID (sy_user.user_id, 관리자 발송 시)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("logId", syhSendEmailLog.logId,
                   "sendDate", syhSendEmailLog.sendDate),
        new OrderSpecifier<>(Order.DESC, syhSendEmailLog.regDate),
        new OrderSpecifier<>(Order.ASC, syhSendEmailLog.logId));
    }

    /* 이메일 발송 로그 수정 */
    @Override
    public int updateSelective(SyhSendEmailLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhSendEmailLog);
        boolean hasAny = false;

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
        update.set(syhSendEmailLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhSendEmailLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }

    /** 재발송 대상 — 관리 엔티티 그대로 반환 */
    @Override
    public List<SyhSendEmailLog> selectFailedBefore(java.time.LocalDateTime threshold) {
        return queryFactory.selectFrom(syhSendEmailLog)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectFailedBefore()")
                .where(syhSendEmailLog.resultCd.eq("FAILED"), syhSendEmailLog.sendDate.lt(threshold))
                .fetch();
    }
}
