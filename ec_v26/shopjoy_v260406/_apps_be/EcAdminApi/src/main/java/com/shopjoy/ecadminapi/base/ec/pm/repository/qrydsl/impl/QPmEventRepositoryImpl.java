package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmEventProd;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.QPdProd;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVendor;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmEvent QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmEventRepositoryImpl implements QPmEventRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmEventRepositoryImpl";
    private static final QPmEvent pmEvent = QPmEvent.pmEvent;    // EXISTS 서브쿼리용 별칭 (업체/담당MD 필터 — pm_event_prod → pd_prod → sy_vendor/sy_user)
    private static final QPmEventProd eventProdEx = new QPmEventProd("event_prod_ex");
    private static final QPdProd      pProdEx     = new QPdProd("p_prod_ex");
    private static final QSyVendor    syVendorEx  = new QSyVendor("sy_vendor_ex");
    private static final QSyUser      syUserEx    = new QSyUser("sy_user_ex");

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * EVENT_TYPE    {PROMOTION: '프로모션', FLASH: '플래시세일', CAMPAIGN: '캠페인', COUPON: '쿠폰이벤트'}
     * EVENT_STATUS  {DRAFT: '초안', ACTIVE: '진행중', PAUSED: '일시정지', ENDED: '종료', CLOSED: '마감'}
     * EVENT_TARGET  {ALL: '전체', MEMBER: '회원', GRADE: '특정등급', GUEST: '비회원'}
     */
    private JPAQuery<PmEventDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmEventDto.Item.class,
                        pmEvent.eventId,               // 이벤트ID (PK, YYMMDDhhmmss+rand4)
                        pmEvent.eventNm,               // 이벤트명
                        pmEvent.eventTypeCd,           // 이벤트유형 — EVENT_TYPE {PROMOTION, FLASH, CAMPAIGN, COUPON}
                        pmEvent.imgUrl,                // 배너이미지URL
                        pmEvent.eventTitle,            // 이벤트 제목
                        pmEvent.eventContent,          // 이벤트 상세내용
                        pmEvent.startDate,             // 이벤트 시작일
                        pmEvent.endDate,               // 이벤트 종료일
                        pmEvent.noticeStart,           // 예고 시작일
                        pmEvent.noticeEnd,             // 예고 종료일
                        pmEvent.eventStatusCd,         // 상태 — EVENT_STATUS {DRAFT, ACTIVE, PAUSED, ENDED, CLOSED}
                        pmEvent.eventStatusCdBefore,   // 변경 전 이벤트상태 — EVENT_STATUS
                        pmEvent.targetTypeCd,          // 대상유형 — EVENT_TARGET {ALL, MEMBER, GRADE, GUEST}
                        pmEvent.sortOrd,               // 정렬순서
                        pmEvent.viewCnt,               // 조회수
                        pmEvent.useYn,                 // 사용여부 Y/N
                        pmEvent.eventDesc,             // 이벤트설명
                        pmEvent.regBy, pmEvent.regDate, pmEvent.updBy, pmEvent.updDate
                ))
                .from(pmEvent);
    }

    /* 이벤트 키조회 */
    @Override
    public Optional<PmEventDto.Item> selectById(String eventId) {
        PmEventDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmEvent.eventId.eq(eventId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 이벤트 목록조회 */
    @Override
    public List<PmEventDto.Item> selectList(PmEventDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = pmEvent.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = pmEvent.updDate;
        }
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<PmEventDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(pmEvent.eventId, search.getEventIds()),
                    QdslUtil.strEq(pmEvent.eventId, search.getEventId()),
                    QdslUtil.strEq(pmEvent.useYn, search.getUseYn()),
                    QdslUtil.strEq(pmEvent.eventStatusCd, search.getEventStatusCd()),
                    QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                    andVendorMd(search),
                    andSearchValue(search.getSearchValue(), search.getSearchType())
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

    /* 이벤트 페이지조회 */
    @Override
    public BasePage<PmEventDto.Item> selectPageData(PmEventDto.Request search) {
        DateTimePath<LocalDateTime> dateRangeField = pmEvent.regDate;
        if ("upd_date".equals(search.getDateRangeType())) {
            dateRangeField = pmEvent.updDate;
        }
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strIn(pmEvent.eventId, search.getEventIds()),
                QdslUtil.strEq(pmEvent.eventId, search.getEventId()),
                QdslUtil.strEq(pmEvent.useYn, search.getUseYn()),
                QdslUtil.strEq(pmEvent.eventStatusCd, search.getEventStatusCd()),
                QdslUtil.dateBetween(dateRangeField, search.getDateRangeStart(), search.getDateRangeEnd()),
                andVendorMd(search),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmEventDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmEventDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmEvent.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmEventDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }
    /** andVendorMd — 대상상품/업체/담당MD 필터. pm_event_prod(event_id↔prod_id) 를 거쳐
     *  pd_prod 의 vendor_id/md_user_id 까지 조인해야 하는 2단 EXISTS.
     *  ⚠ memberId 는 추가하지 않았다 — 이벤트 참여자를 회원별로 기록하는 테이블이
     *     없어(PmEventItem 은 target_type_cd/target_id 범용 폴리모픽, 회원 전용 아님)
     *     안전하게 연결할 근거 컬럼이 없다. */
    private BooleanExpression andVendorMd(PmEventDto.Request search) {
        boolean needProd   = StringUtils.hasText(search.getProdId()) || StringUtils.hasText(search.getProdNm());
        boolean needVendor = StringUtils.hasText(search.getVendorId()) || StringUtils.hasText(search.getVendorNm());
        boolean needMd     = StringUtils.hasText(search.getMdUserId()) || StringUtils.hasText(search.getMdUserNm());
        if (!needProd && !needVendor && !needMd) return null;

        com.querydsl.jpa.JPQLQuery<Integer> sub = JPAExpressions.selectOne().from(eventProdEx)
            .where(eventProdEx.eventId.eq(pmEvent.eventId));

        if (needProd) {
            sub = sub.where(
                QdslUtil.strEq(eventProdEx.prodId, search.getProdId()),
                StringUtils.hasText(search.getProdId()) ? null
                    : JPAExpressions.selectOne().from(pProdEx)
                          .where(pProdEx.prodId.eq(eventProdEx.prodId), QdslUtil.strLike(pProdEx.prodNm, search.getProdNm())).exists());
        }
        if (needVendor) {
            sub = sub.where(JPAExpressions.selectOne().from(pProdEx).join(syVendorEx).on(syVendorEx.vendorId.eq(pProdEx.vendorId))
                .where(pProdEx.prodId.eq(eventProdEx.prodId),
                       QdslUtil.strEq(syVendorEx.vendorId, search.getVendorId()),
                       StringUtils.hasText(search.getVendorId()) ? null : QdslUtil.strLike(syVendorEx.vendorNm, search.getVendorNm()))
                .exists());
        }
        if (needMd) {
            sub = sub.where(JPAExpressions.selectOne().from(pProdEx).join(syUserEx).on(syUserEx.userId.eq(pProdEx.mdUserId))
                .where(pProdEx.prodId.eq(eventProdEx.prodId),
                       QdslUtil.strEq(syUserEx.userId, search.getMdUserId()),
                       StringUtils.hasText(search.getMdUserId()) ? null : QdslUtil.strLike(syUserEx.userNm, search.getMdUserNm()))
                .exists());
        }
        return sub.exists();
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("eventContent", pmEvent.eventContent),
            QdslUtil.FieldDef.like("eventDesc", pmEvent.eventDesc),
            QdslUtil.FieldDef.like("eventId", pmEvent.eventId),
            QdslUtil.FieldDef.like("eventNm", pmEvent.eventNm),
            QdslUtil.FieldDef.like("eventStatusCd", pmEvent.eventStatusCd),
            QdslUtil.FieldDef.like("eventStatusCdBefore", pmEvent.eventStatusCdBefore),
            QdslUtil.FieldDef.like("eventTitle", pmEvent.eventTitle),
            QdslUtil.FieldDef.like("eventTypeCd", pmEvent.eventTypeCd),
            QdslUtil.FieldDef.like("imgUrl", pmEvent.imgUrl),
            QdslUtil.FieldDef.like("targetTypeCd", pmEvent.targetTypeCd),
            QdslUtil.FieldDef.like("useYn", pmEvent.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("eventId", pmEvent.eventId,
                   "eventNm", pmEvent.eventNm,
                   "regDate", pmEvent.regDate,
                   "sortOrd", pmEvent.sortOrd),
        new OrderSpecifier<>(Order.ASC, pmEvent.sortOrd),
        new OrderSpecifier<>(Order.ASC, pmEvent.regDate),
        new OrderSpecifier<>(Order.ASC, pmEvent.eventId));
    }

    /* 이벤트 수정 */

    @Override
    public int updateSelective(PmEvent entity) {
        if (entity.getEventId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmEvent);
        boolean hasAny = false;

        if (entity.getEventNm()             != null) { update.set(pmEvent.eventNm,             entity.getEventNm());             hasAny = true; }
        if (entity.getEventTypeCd()         != null) { update.set(pmEvent.eventTypeCd,         entity.getEventTypeCd());         hasAny = true; }
        if (entity.getImgUrl()              != null) { update.set(pmEvent.imgUrl,              entity.getImgUrl());              hasAny = true; }
        if (entity.getEventTitle()          != null) { update.set(pmEvent.eventTitle,          entity.getEventTitle());          hasAny = true; }
        if (entity.getEventContent()        != null) { update.set(pmEvent.eventContent,        entity.getEventContent());        hasAny = true; }
        if (entity.getStartDate()           != null) { update.set(pmEvent.startDate,           entity.getStartDate());           hasAny = true; }
        if (entity.getEndDate()             != null) { update.set(pmEvent.endDate,             entity.getEndDate());             hasAny = true; }
        if (entity.getNoticeStart()         != null) { update.set(pmEvent.noticeStart,         entity.getNoticeStart());         hasAny = true; }
        if (entity.getNoticeEnd()           != null) { update.set(pmEvent.noticeEnd,           entity.getNoticeEnd());           hasAny = true; }
        if (entity.getEventStatusCd()       != null) { update.set(pmEvent.eventStatusCd,       entity.getEventStatusCd());       hasAny = true; }
        if (entity.getEventStatusCdBefore() != null) { update.set(pmEvent.eventStatusCdBefore, entity.getEventStatusCdBefore()); hasAny = true; }
        if (entity.getTargetTypeCd()        != null) { update.set(pmEvent.targetTypeCd,        entity.getTargetTypeCd());        hasAny = true; }
        if (entity.getSortOrd()             != null) { update.set(pmEvent.sortOrd,             entity.getSortOrd());             hasAny = true; }
        if (entity.getViewCnt()             != null) { update.set(pmEvent.viewCnt,             entity.getViewCnt());             hasAny = true; }
        if (entity.getUseYn()               != null) { update.set(pmEvent.useYn,               entity.getUseYn());               hasAny = true; }
        if (entity.getEventDesc()           != null) { update.set(pmEvent.eventDesc,           entity.getEventDesc());           hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(pmEvent.updBy,               entity.getUpdBy());               hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmEvent.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmEvent.eventId.eq(entity.getEventId())).execute();
        return (int) affected;
    }
}
