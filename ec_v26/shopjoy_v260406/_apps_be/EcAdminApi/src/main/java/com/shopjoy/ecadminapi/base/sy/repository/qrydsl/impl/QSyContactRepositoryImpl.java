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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyContact;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyContact;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyContact QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyContactRepositoryImpl implements QSyContactRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyContactRepositoryImpl";
    private static final QSyContact syContact = QSyContact.syContact;
    private static final QSySite sySite = QSySite.sySite;
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("answerUserId", syContact.answerUserId),
        Map.entry("contentAttachGrpId", syContact.contentAttachGrpId),
        Map.entry("answerAttachGrpId", syContact.answerAttachGrpId),
        Map.entry("categoryCd", syContact.categoryCd),
        Map.entry("contactAnswer", syContact.contactAnswer),
        Map.entry("contactContent", syContact.contactContent),
        Map.entry("contactId", syContact.contactId),
        Map.entry("contactStatusCd", syContact.contactStatusCd),
        Map.entry("contactTitle", syContact.contactTitle),
        Map.entry("memberId", syContact.memberId),
        Map.entry("memberNm", syContact.memberNm),
        Map.entry("siteId", syContact.siteId)
    );
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CONTACT_STATUS {RECEIVED: '접수', IN_PROGRESS: '처리중', DONE: '완료', ON_HOLD: '보류'}
     */
    private JPAQuery<SyContactDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyContactDto.Item.class,
                        syContact.contactId,           // 문의ID (YYMMDDhhmmss+rand4)
                        syContact.siteId,              // 사이트ID (sy_site.site_id)
                        syContact.memberId,             // 회원ID
                        syContact.memberNm,             // 문의자명
                        syContact.categoryCd,           // 문의유형
                        syContact.contactTitle,         // 제목
                        syContact.contactContent,       // 문의내용
                        syContact.contentAttachGrpId,   // 문의 내용 첨부파일그룹ID (sy_attach_grp.attach_grp_id)
                        syContact.contactStatusCd,      // 처리상태 — CONTACT_STATUS {RECEIVED: '접수', IN_PROGRESS: '처리중', DONE: '완료', ON_HOLD: '보류'}
                        syContact.contactAnswer,        // 답변내용
                        syContact.answerAttachGrpId,    // 답변 첨부파일그룹ID (sy_attach_grp.attach_grp_id)
                        syContact.answerUserId,         // 답변자 (sy_user.user_id)
                        syContact.answerDate,           // 답변일시
                        syContact.contactDate,          // 문의일시
                        syContact.regBy,                // 등록자
                        syContact.regDate,              // 등록일시
                        syContact.updBy,                // 수정자
                        syContact.updDate,              // 수정일시
                        sySite.siteNm.as("siteNm")      // 사이트명 (sy_site 조인)
                ))
                .from(syContact)
                .leftJoin(sySite).on(sySite.siteId.eq(syContact.siteId));
    }

    /* 문의 키조회 */
    @Override
    public Optional<SyContactDto.Item> selectById(String contactId) {
        SyContactDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syContact.contactId.eq(contactId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 문의 목록조회 */
    @Override
    public List<SyContactDto.Item> selectList(SyContactDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<SyContactDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(syContact.siteId, search.getSiteId()),
                    QdslUtil.strEq(syContact.contactId, search.getContactId()),
                    QdslUtil.strEq(syContact.memberId, search.getMemberId()),
                    QdslUtil.strEq(syContact.categoryCd, search.getCategoryCd()),
                    QdslUtil.strEq(syContact.contactStatusCd, search.getStatus()),
                    andDateRangeBetween(search),
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

    /* 문의 페이지조회 */
    @Override
    public SyContactDto.PageResponse selectPageData(SyContactDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(syContact.siteId, search.getSiteId()),
                QdslUtil.strEq(syContact.contactId, search.getContactId()),
                QdslUtil.strEq(syContact.memberId, search.getMemberId()),
                QdslUtil.strEq(syContact.categoryCd, search.getCategoryCd()),
                QdslUtil.strEq(syContact.contactStatusCd, search.getStatus()),
                andDateRangeBetween(search),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<SyContactDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<SyContactDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syContact.count())
                .where(wheres)
                .fetchOne();

        SyContactDto.PageResponse res = new SyContactDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    /* 등록일(regDate) 기간 검색 — dateStart/dateEnd (yyyy-MM-dd) 포함 범위 */
    private BooleanExpression andDateRangeBetween(SyContactDto.Request search) {
        if (search == null) return null;
        BooleanExpression expr = null;
        if (StringUtils.hasText(search.getDateStart())) {
            LocalDateTime from = LocalDate.parse(search.getDateStart(), DF).atStartOfDay();
            expr = syContact.regDate.goe(from);
        }
        if (StringUtils.hasText(search.getDateEnd())) {
            LocalDateTime to = LocalDate.parse(search.getDateEnd(), DF).atTime(23, 59, 59);
            BooleanExpression toExpr = syContact.regDate.loe(to);
            expr = expr == null ? toExpr : expr.and(toExpr);
        }
        return expr;
    }

    private BooleanExpression andSearchValueLike(SyContactDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(SyContactDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, syContact.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syContact.contactId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("contactId".equals(field)) {
                    orders.add(new OrderSpecifier(order, syContact.contactId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, syContact.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, syContact.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, syContact.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, syContact.contactId));
        }
        return orders;
    }

    /* 문의 수정 */

    @Override
    public int updateSelective(SyContact entity) {
        if (entity.getContactId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syContact);
        boolean hasAny = false;

        if (entity.getSiteId()          != null) { update.set(syContact.siteId,          entity.getSiteId());          hasAny = true; }
        if (entity.getMemberId()        != null) { update.set(syContact.memberId,        entity.getMemberId());        hasAny = true; }
        if (entity.getMemberNm()        != null) { update.set(syContact.memberNm,        entity.getMemberNm());        hasAny = true; }
        if (entity.getCategoryCd()      != null) { update.set(syContact.categoryCd,      entity.getCategoryCd());      hasAny = true; }
        if (entity.getContactTitle()    != null) { update.set(syContact.contactTitle,    entity.getContactTitle());    hasAny = true; }
        if (entity.getContactContent()  != null) { update.set(syContact.contactContent,  entity.getContactContent());  hasAny = true; }
        if (entity.getContentAttachGrpId() != null) { update.set(syContact.contentAttachGrpId, entity.getContentAttachGrpId()); hasAny = true; }
        if (entity.getContactStatusCd() != null) { update.set(syContact.contactStatusCd, entity.getContactStatusCd()); hasAny = true; }
        if (entity.getContactAnswer()   != null) { update.set(syContact.contactAnswer,   entity.getContactAnswer());   hasAny = true; }
        if (entity.getAnswerAttachGrpId() != null) { update.set(syContact.answerAttachGrpId, entity.getAnswerAttachGrpId()); hasAny = true; }
        if (entity.getAnswerUserId()    != null) { update.set(syContact.answerUserId,    entity.getAnswerUserId());    hasAny = true; }
        if (entity.getAnswerDate()      != null) { update.set(syContact.answerDate,      entity.getAnswerDate());      hasAny = true; }
        if (entity.getContactDate()     != null) { update.set(syContact.contactDate,     entity.getContactDate());     hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(syContact.updBy,           entity.getUpdBy());           hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(syContact.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syContact.contactId.eq(entity.getContactId())).execute();
        return (int) affected;
    }
}
