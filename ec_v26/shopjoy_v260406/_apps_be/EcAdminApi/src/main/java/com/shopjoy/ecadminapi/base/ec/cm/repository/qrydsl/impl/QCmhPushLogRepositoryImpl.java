package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmhPushLogRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmhPushLog(푸시/알림 발송 로그) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmhPushLogRepositoryImpl implements QCmhPushLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmhPushLogRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QCmhPushLog cmhPushLog = QCmhPushLog.cmhPushLog;    /*
     * baseSelColumnQuery — 코드성 필드 예시 (PUSH_CHANNEL / PUSH_RESULT 는 sy_code 미등록 — 실제 코드 등록 없음)
     * channel_cd : 발송채널 구분 코드 (코드: PUSH_CHANNEL, DB 등록값 없음 — 용도만 설명)
     * result_cd  : 발송결과 코드 (코드: PUSH_RESULT, DB 등록값 없음. 컬럼 기본값은 'SUCCESS')
     * ref_type_cd: 연관유형코드 (자유 문자열, 예: ORDER/CLAIM/EVENT 등 — sy_code 미등록)
     */
    private JPAQuery<CmhPushLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmhPushLogDto.Item.class,
                        cmhPushLog.logId,           // 로그ID (PK, YYMMDDhhmmss+rand4)
                        cmhPushLog.channelCd,       // 발송채널 (코드: PUSH_CHANNEL — sy_code 미등록)
                        cmhPushLog.templateId,      // 템플릿ID (sy_template.template_id)
                        cmhPushLog.memberId,        // 대상 회원ID
                        cmhPushLog.recvAddr,        // 수신처 (이메일/전화번호/디바이스토큰)
                        cmhPushLog.pushLogTitle,    // 발송 제목
                        cmhPushLog.pushLogContent,  // 발송 내용
                        cmhPushLog.resultCd,        // 발송결과 (코드: PUSH_RESULT — sy_code 미등록, DB 기본값 'SUCCESS')
                        cmhPushLog.failReason,      // 실패 사유
                        cmhPushLog.sendDate,        // 발송일시
                        cmhPushLog.refTypeCd,       // 연관유형코드 (ORDER/CLAIM/EVENT 등, 자유 코드)
                        cmhPushLog.refId,           // 연관ID
                        cmhPushLog.regBy,           // 등록자
                        cmhPushLog.regDate,         // 등록일시
                        cmhPushLog.updBy,           // 수정자
                        cmhPushLog.updDate,          // 수정일시
                        cmhPushLog.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(cmhPushLog)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(cmhPushLog.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(cmhPushLog.regBy)) // 등록자
                ;
    }

    /** 단건 조회 */
    @Override
    public Optional<CmhPushLogDto.Item> selectById(String logId) {
        CmhPushLogDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmhPushLog.logId.eq(logId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /** 전체 목록 */
    @Override
    public List<CmhPushLogDto.Item> selectList(CmhPushLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmhPushLog.logId, search.getLogId())); // 로그ID 필터
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmhPushLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmhPushLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("send_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmhPushLog.sendDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<CmhPushLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<CmhPushLogDto.Item> list = query.fetch();
        return list;
    }

    /** 페이지 목록 */
    @Override
    public BasePage<CmhPushLogDto.Item> selectPageData(CmhPushLogDto.Request search) {
        int pageNo = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmhPushLog.logId, search.getLogId())); // 로그ID 필터
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmhPushLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmhPushLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("send_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmhPushLog.sendDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<CmhPushLogDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<CmhPushLogDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmhPushLog.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmhPushLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 예: "channelCd,failReason,logId,memberId,pushLogContent" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("channelCd", cmhPushLog.channelCd), // 발송채널 — MSG_CHANNEL {EMAIL:이메일, SMS:SMS, KAKAO:알림톡, PUSH:푸시}
            QdslUtil.FieldDef.like("failReason", cmhPushLog.failReason), // 실패 사유
            QdslUtil.FieldDef.like("logId", cmhPushLog.logId), // 로그ID 필터
            QdslUtil.FieldDef.like("memberId", cmhPushLog.memberId), // 대상 회원ID
            QdslUtil.FieldDef.like("pushLogContent", cmhPushLog.pushLogContent), // 발송 내용
            QdslUtil.FieldDef.like("pushLogTitle", cmhPushLog.pushLogTitle), // 발송 제목
            QdslUtil.FieldDef.like("recvAddr", cmhPushLog.recvAddr), // 수신처 (이메일/전화번호/디바이스토큰)
            QdslUtil.FieldDef.like("refId", cmhPushLog.refId), // 연관ID
            QdslUtil.FieldDef.like("refTypeCd", cmhPushLog.refTypeCd), // 연관유형코드 (ORDER/CLAIM/EVENT 등)
            QdslUtil.FieldDef.like("resultCd", cmhPushLog.resultCd), // 발송결과 — SEND_RESULT
            QdslUtil.FieldDef.like("templateId", cmhPushLog.templateId) // 템플릿ID (sy_template.template_id)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("logId", cmhPushLog.logId,
                   "pushLogTitle", cmhPushLog.pushLogTitle,
                   "sendDate", cmhPushLog.sendDate),
        new OrderSpecifier<>(Order.DESC, cmhPushLog.regDate),
        new OrderSpecifier<>(Order.ASC, cmhPushLog.logId));
    }

    /** updateSelective — Mapper XML 에 update 미정의이나 Mapper Java 에 선언되어 있어 Entity 모든 갱신 필드 대상으로 처리 */
    @Override
    public int updateSelective(CmhPushLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmhPushLog);
        boolean hasAny = false;

        if (entity.getChannelCd()      != null) { update.set(cmhPushLog.channelCd,      entity.getChannelCd());      hasAny = true; }
        if (entity.getTemplateId()     != null) { update.set(cmhPushLog.templateId,     entity.getTemplateId());     hasAny = true; }
        if (entity.getMemberId()       != null) { update.set(cmhPushLog.memberId,       entity.getMemberId());       hasAny = true; }
        if (entity.getRecvAddr()       != null) { update.set(cmhPushLog.recvAddr,       entity.getRecvAddr());       hasAny = true; }
        if (entity.getPushLogTitle()   != null) { update.set(cmhPushLog.pushLogTitle,   entity.getPushLogTitle());   hasAny = true; }
        if (entity.getPushLogContent() != null) { update.set(cmhPushLog.pushLogContent, entity.getPushLogContent()); hasAny = true; }
        if (entity.getResultCd()       != null) { update.set(cmhPushLog.resultCd,       entity.getResultCd());       hasAny = true; }
        if (entity.getFailReason()     != null) { update.set(cmhPushLog.failReason,     entity.getFailReason());     hasAny = true; }
        if (entity.getSendDate()       != null) { update.set(cmhPushLog.sendDate,       entity.getSendDate());       hasAny = true; }
        if (entity.getRefTypeCd()      != null) { update.set(cmhPushLog.refTypeCd,      entity.getRefTypeCd());      hasAny = true; }
        if (entity.getRefId()          != null) { update.set(cmhPushLog.refId,          entity.getRefId());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(cmhPushLog.updBy,          entity.getUpdBy());          hasAny = true; }
        update.set(cmhPushLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmhPushLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
