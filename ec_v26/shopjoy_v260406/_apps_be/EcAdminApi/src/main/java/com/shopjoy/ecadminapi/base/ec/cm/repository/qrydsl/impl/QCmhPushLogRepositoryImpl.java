package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmhPushLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmhPushLog QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmhPushLogRepositoryImpl implements QCmhPushLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmhPushLogRepositoryImpl";
    private static final QCmhPushLog cmhPushLog = QCmhPushLog.cmhPushLog;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "send_date", cmhPushLog.sendDate,
        "reg_date", cmhPushLog.regDate,
        "upd_date", cmhPushLog.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("channelCd", cmhPushLog.channelCd),
        Map.entry("failReason", cmhPushLog.failReason),
        Map.entry("logId", cmhPushLog.logId),
        Map.entry("memberId", cmhPushLog.memberId),
        Map.entry("pushLogContent", cmhPushLog.pushLogContent),
        Map.entry("pushLogTitle", cmhPushLog.pushLogTitle),
        Map.entry("recvAddr", cmhPushLog.recvAddr),
        Map.entry("refId", cmhPushLog.refId),
        Map.entry("refTypeCd", cmhPushLog.refTypeCd),
        Map.entry("resultCd", cmhPushLog.resultCd),
        Map.entry("siteId", cmhPushLog.siteId),
        Map.entry("templateId", cmhPushLog.templateId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 (PUSH_CHANNEL / PUSH_RESULT 는 sy_code 미등록 — 실제 코드 등록 없음)
     * channel_cd : 발송채널 구분 코드 (코드: PUSH_CHANNEL, DB 등록값 없음 — 용도만 설명)
     * result_cd  : 발송결과 코드 (코드: PUSH_RESULT, DB 등록값 없음. 컬럼 기본값은 'SUCCESS')
     * ref_type_cd: 연관유형코드 (자유 문자열, 예: ORDER/CLAIM/EVENT 등 — sy_code 미등록)
     */
    private JPAQuery<CmhPushLogDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmhPushLogDto.Item.class,
                        cmhPushLog.logId,           // 로그ID (PK, YYMMDDhhmmss+rand4)
                        cmhPushLog.siteId,          // 사이트ID
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
                        cmhPushLog.updDate          // 수정일시
                ))
                .from(cmhPushLog);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmhPushLogDto.Item> selectById(String logId) {
        CmhPushLogDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmhPushLog.logId.eq(logId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmhPushLogDto.Item> selectList(CmhPushLogDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmhPushLogDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()").where(
                QdslUtil.strEq(cmhPushLog.siteId, search.getSiteId()),
                QdslUtil.strEq(cmhPushLog.logId, search.getLogId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        )
        .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /** 페이지 목록 */
    @Override
    public CmhPushLogDto.PageResponse selectPageData(CmhPushLogDto.Request search) {
        int pageNo = search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;
        int limit = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(cmhPushLog.siteId, search.getSiteId()),
                QdslUtil.strEq(cmhPushLog.logId, search.getLogId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<CmhPushLogDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<CmhPushLogDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmhPushLog.count())
                .where(wheres)
                .fetchOne();

        CmhPushLogDto.PageResponse res = new CmhPushLogDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(CmhPushLogDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmhPushLogDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, cmhPushLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmhPushLog.logId));
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
                    orders.add(new OrderSpecifier(order, cmhPushLog.logId));
                } else if ("pushLogTitle".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmhPushLog.pushLogTitle));
                } else if ("sendDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, cmhPushLog.sendDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, cmhPushLog.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmhPushLog.logId));
        }
        return orders;
    }

    /** updateSelective — Mapper XML 에 update 미정의이나 Mapper Java 에 선언되어 있어 Entity 모든 갱신 필드 대상으로 처리 */
    @Override
    public int updateSelective(CmhPushLog entity) {
        if (entity.getLogId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmhPushLog);
        boolean hasAny = false;

        if (entity.getSiteId()         != null) { update.set(cmhPushLog.siteId,         entity.getSiteId());         hasAny = true; }
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(cmhPushLog.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmhPushLog.logId.eq(entity.getLogId())).execute();
        return (int) affected;
    }
}
