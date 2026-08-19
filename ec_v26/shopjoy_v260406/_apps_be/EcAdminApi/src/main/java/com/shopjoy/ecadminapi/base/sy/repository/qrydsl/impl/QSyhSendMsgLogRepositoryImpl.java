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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyTemplate;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhSendMsgLogRepository;
import lombok.RequiredArgsConstructor;

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
    private static final QVwSyCode        cd_mc = new QVwSyCode("cd_mc");
    private static final QVwSyCode        cd_sr = new QVwSyCode("cd_sr");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * MSG_CHANNEL   {EMAIL: '이메일', SMS: 'SMS', KAKAO: '알림톡', PUSH: '푸시'}
     * SEND_RESULT   {SUCCESS: '성공', FAILED: '실패', PENDING: '대기'}
     */
    /* 메시지 발송 로그 baseSelColumnQuery */
    private JPAQuery<SyhSendMsgLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyhSendMsgLogDto.Item.class,
                        syhSendMsgLog.logId,            // 로그ID (PK, YYMMDDhhmmss+rand4)
                        syhSendMsgLog.channelCd,        // 발송채널 — MSG_CHANNEL {EMAIL: '이메일', SMS: 'SMS', KAKAO: '알림톡', PUSH: '푸시'}
                        syhSendMsgLog.templateId,       // 템플릿ID (sy_template.template_id)
                        syhSendMsgLog.templateCode,     // 템플릿코드 스냅샷
                        syhSendMsgLog.memberId,         // 대상 회원ID (ec_member.member_id, 비회원 NULL)
                        syhSendMsgLog.userId,           // 대상 관리자ID (sy_user.user_id, 관리자 발송 시)
                        syhSendMsgLog.recvPhone,        // 수신 전화번호 (SMS/LMS/카카오)
                        syhSendMsgLog.deviceToken,      // 디바이스 토큰 (앱 푸시)
                        syhSendMsgLog.senderPhone,      // 발신 번호 (SMS/LMS)
                        syhSendMsgLog.title,            // 제목 (LMS/앱 푸시)
                        syhSendMsgLog.content,          // 발송 내용 (치환 완료본)
                        syhSendMsgLog.params,           // 치환 파라미터 JSON
                        syhSendMsgLog.kakaoTplCode,     // 카카오 알림톡 템플릿 코드 (카카오 채널 시)
                        syhSendMsgLog.resultCd,         // 발송결과 — SEND_RESULT {SUCCESS: '성공', FAILED: '실패', PENDING: '대기'}
                        syhSendMsgLog.resultMsg,        // 통신사/카카오 응답 메시지
                        syhSendMsgLog.failReason,       // 실패 사유
                        syhSendMsgLog.sendDate,         // 발송일시
                        syhSendMsgLog.refTypeCd,        // 연관유형코드 (ORDER/CLAIM/JOIN/AUTH 등)
                        syhSendMsgLog.refId,            // 연관ID
                        syhSendMsgLog.regBy,            // 등록자
                        syhSendMsgLog.regDate,          // 등록일시
                        syhSendMsgLog.updBy,            // 수정자
                        syhSendMsgLog.updDate,          // 수정일시
                        syTemplate.templateNm.as("templateNm"),     // 템플릿명 (조인: sy_template)
                        syUser.userNm.as("userNm"),                 // 관리자명 (조인: sy_user)
                        cd_mc.codeLabel.as("channelCdNm"),           // 발송채널 코드명 (조인: sy_code MSG_CHANNEL)
                        cd_sr.codeLabel.as("resultCdNm")             // 발송결과 코드명 (조인: sy_code SEND_RESULT)
                ))
                .from(syhSendMsgLog)
                .innerJoin(cd_mc).on(cd_mc.codeGrp.eq("MSG_CHANNEL").and(cd_mc.codeValue.eq(syhSendMsgLog.channelCd))) // 메시지채널
                .leftJoin(syTemplate).on(syTemplate.templateId.eq(syhSendMsgLog.templateId)) // 템플릿
                .leftJoin(syUser).on(syUser.userId.eq(syhSendMsgLog.userId)) // 사용자
                .leftJoin(cd_sr).on(cd_sr.codeGrp.eq("SEND_RESULT").and(cd_sr.codeValue.eq(syhSendMsgLog.resultCd))) // 발송결과
                ;
    }

    /* 메시지 발송 로그 키조회 */
    @Override
    public Optional<SyhSendMsgLogDto.Item> selectById(String id) {
        SyhSendMsgLogDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syhSendMsgLog.logId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 메시지 발송 로그 목록조회 */
    @Override
    public List<SyhSendMsgLogDto.Item> selectList(SyhSendMsgLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhSendMsgLog.logId, search.getLogId()));
        whereList.add(QdslUtil.strEq(syhSendMsgLog.userId, search.getUserId()));
        whereList.add(QdslUtil.strEq(syhSendMsgLog.templateId, search.getTemplateId()));
        whereList.add(QdslUtil.strEq(syhSendMsgLog.refTypeCd, search.getTypeCd()));
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendMsgLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendMsgLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("send_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendMsgLog.sendDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyhSendMsgLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(wheres)
        .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyhSendMsgLogDto.Item> list = query.fetch();
        return list;
    }

    /* 메시지 발송 로그 페이지조회 */
    @Override
    public BasePage<SyhSendMsgLogDto.Item> selectPageData(SyhSendMsgLogDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syhSendMsgLog.logId, search.getLogId()));
        whereList.add(QdslUtil.strEq(syhSendMsgLog.userId, search.getUserId()));
        whereList.add(QdslUtil.strEq(syhSendMsgLog.templateId, search.getTemplateId()));
        whereList.add(QdslUtil.strEq(syhSendMsgLog.refTypeCd, search.getTypeCd()));
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendMsgLog.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendMsgLog.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("send_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(syhSendMsgLog.sendDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<SyhSendMsgLogDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyhSendMsgLogDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syhSendMsgLog.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyhSendMsgLogDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("channelCd", syhSendMsgLog.channelCd),
            QdslUtil.FieldDef.like("content", syhSendMsgLog.content),
            QdslUtil.FieldDef.like("deviceToken", syhSendMsgLog.deviceToken),
            QdslUtil.FieldDef.like("failReason", syhSendMsgLog.failReason),
            QdslUtil.FieldDef.like("kakaoTplCode", syhSendMsgLog.kakaoTplCode),
            QdslUtil.FieldDef.like("logId", syhSendMsgLog.logId),
            QdslUtil.FieldDef.like("memberId", syhSendMsgLog.memberId),
            QdslUtil.FieldDef.like("params", syhSendMsgLog.params),
            QdslUtil.FieldDef.like("recvPhone", syhSendMsgLog.recvPhone),
            QdslUtil.FieldDef.like("refId", syhSendMsgLog.refId),
            QdslUtil.FieldDef.like("refTypeCd", syhSendMsgLog.refTypeCd),
            QdslUtil.FieldDef.like("resultCd", syhSendMsgLog.resultCd),
            QdslUtil.FieldDef.like("resultMsg", syhSendMsgLog.resultMsg),
            QdslUtil.FieldDef.like("senderPhone", syhSendMsgLog.senderPhone),
            QdslUtil.FieldDef.like("templateCode", syhSendMsgLog.templateCode),
            QdslUtil.FieldDef.like("templateId", syhSendMsgLog.templateId),
            QdslUtil.FieldDef.like("title", syhSendMsgLog.title),
            QdslUtil.FieldDef.like("userId", syhSendMsgLog.userId)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("logId", syhSendMsgLog.logId,
                   "sendDate", syhSendMsgLog.sendDate),
        new OrderSpecifier<>(Order.DESC, syhSendMsgLog.regDate),
        new OrderSpecifier<>(Order.ASC, syhSendMsgLog.logId));
    }

    /* 메시지 발송 로그 수정 */
    @Override
    public int updateSelective(SyhSendMsgLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syhSendMsgLog);
        boolean hasAny = false;

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
        update.set(syhSendMsgLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syhSendMsgLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
