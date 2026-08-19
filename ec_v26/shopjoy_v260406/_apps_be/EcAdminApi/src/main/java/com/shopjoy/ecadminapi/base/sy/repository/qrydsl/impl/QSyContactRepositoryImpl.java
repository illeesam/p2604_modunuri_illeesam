package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyContact;
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
/** SyContact(고객문의) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyContactRepositoryImpl implements QSyContactRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyContactRepositoryImpl";
    private static final QSyContact syContact = QSyContact.syContact;
    private static final DateTimeFormatter DF = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CONTACT_STATUS {RECEIVED: '접수', IN_PROGRESS: '처리중', DONE: '완료', ON_HOLD: '보류'}
     */
    private JPAQuery<SyContactDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyContactDto.Item.class,
                        syContact.contactId,           // 문의ID (YYMMDDhhmmss+rand4)
                        syContact.memberId,             // 회원ID
                        syContact.memberNm,             // 문의자명
                        syContact.categoryCd,           // 문의유형
                        syContact.contactTitle,         // 제목
                        syContact.contactContent,       // 문의내용
                        syContact.contactStatusCd,      // 처리상태 — CONTACT_STATUS {RECEIVED: '접수', IN_PROGRESS: '처리중', DONE: '완료', ON_HOLD: '보류'}
                        syContact.contactAnswer,        // 답변내용
                        syContact.answerUserId,         // 답변자 (sy_user.user_id)
                        syContact.answerDate,           // 답변일시
                        syContact.contactDate,          // 문의일시
                        syContact.regBy,                // 등록자
                        syContact.regDate,              // 등록일시
                        syContact.updBy,                // 수정자
                        syContact.updDate              // 수정일시
                ))
                .from(syContact);
    }

    /* 문의 키조회 */
    @Override
    public Optional<SyContactDto.Item> selectById(String contactId) {
        SyContactDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syContact.contactId.eq(contactId)).fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 문의 목록조회 */
    @Override
    public List<SyContactDto.Item> selectList(SyContactDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syContact.contactId, search.getContactId()));
        whereList.add(QdslUtil.strEq(syContact.memberId, search.getMemberId()));
        whereList.add(QdslUtil.strEq(syContact.categoryCd, search.getCategoryCd()));
        whereList.add(QdslUtil.strEq(syContact.contactStatusCd, search.getStatus()));
        whereList.add(andDateRangeBetween(search));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyContactDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<SyContactDto.Item> list = query.fetch();
        return list;
    }

    /* 문의 페이지조회 */
    @Override
    public BasePage<SyContactDto.Item> selectPageData(SyContactDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syContact.contactId, search.getContactId()));
        whereList.add(QdslUtil.strEq(syContact.memberId, search.getMemberId()));
        whereList.add(QdslUtil.strEq(syContact.categoryCd, search.getCategoryCd()));
        whereList.add(QdslUtil.strEq(syContact.contactStatusCd, search.getStatus()));
        whereList.add(andDateRangeBetween(search));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<SyContactDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyContactDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syContact.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyContactDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */

    /* 등록일(regDate) 기간 검색 — dateRangeStart/dateRangeEnd (yyyy-MM-dd) 포함 범위 */
    private BooleanExpression andDateRangeBetween(SyContactDto.Request search) {
        if (search == null) return null;
        BooleanExpression expr = null;
        if (StringUtils.hasText(search.getDateRangeStart())) {
            LocalDateTime from = LocalDate.parse(search.getDateRangeStart(), DF).atTime(0, 0, 0, 0);
            expr = syContact.regDate.goe(from);
        }
        if (StringUtils.hasText(search.getDateRangeEnd())) {
            /* 23:59:59.999999(나노초까지) — SQL 로그에 검색한 날짜 그대로 찍히면서도(QdslUtil.dateBetween 과 동일 패턴)
             * 리터럴 23:59:59(초 단위)처럼 서브초 데이터를 놓치지 않는다 */
            LocalDateTime to = LocalDate.parse(search.getDateRangeEnd(), DF).atTime(23, 59, 59, 999_999_999);
            BooleanExpression toExpr = syContact.regDate.loe(to);
            expr = expr == null ? toExpr : expr.and(toExpr);
        }
        return expr;
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("answerUserId", syContact.answerUserId),
            QdslUtil.FieldDef.like("categoryCd", syContact.categoryCd),
            QdslUtil.FieldDef.like("contactAnswer", syContact.contactAnswer),
            QdslUtil.FieldDef.like("contactContent", syContact.contactContent),
            QdslUtil.FieldDef.like("contactId", syContact.contactId),
            QdslUtil.FieldDef.like("contactStatusCd", syContact.contactStatusCd),
            QdslUtil.FieldDef.like("contactTitle", syContact.contactTitle),
            QdslUtil.FieldDef.like("memberId", syContact.memberId),
            QdslUtil.FieldDef.like("memberNm", syContact.memberNm)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("contactId", syContact.contactId,
                   "memberNm", syContact.memberNm,
                   "regDate", syContact.regDate),
        new OrderSpecifier<>(Order.DESC, syContact.regDate),
        new OrderSpecifier<>(Order.ASC, syContact.contactId));
    }

    /* 문의 수정 */
    @Override
    public int updateSelective(SyContact entity) {
        if (entity.getContactId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syContact);
        boolean hasAny = false;

        if (entity.getMemberId()        != null) { update.set(syContact.memberId,        entity.getMemberId());        hasAny = true; }
        if (entity.getMemberNm()        != null) { update.set(syContact.memberNm,        entity.getMemberNm());        hasAny = true; }
        if (entity.getCategoryCd()      != null) { update.set(syContact.categoryCd,      entity.getCategoryCd());      hasAny = true; }
        if (entity.getContactTitle()    != null) { update.set(syContact.contactTitle,    entity.getContactTitle());    hasAny = true; }
        if (entity.getContactContent()  != null) { update.set(syContact.contactContent,  entity.getContactContent());  hasAny = true; }
        if (entity.getContactStatusCd() != null) { update.set(syContact.contactStatusCd, entity.getContactStatusCd()); hasAny = true; }
        if (entity.getContactAnswer()   != null) { update.set(syContact.contactAnswer,   entity.getContactAnswer());   hasAny = true; }
        if (entity.getAnswerUserId()    != null) { update.set(syContact.answerUserId,    entity.getAnswerUserId());    hasAny = true; }
        if (entity.getAnswerDate()      != null) { update.set(syContact.answerDate,      entity.getAnswerDate());      hasAny = true; }
        if (entity.getContactDate()     != null) { update.set(syContact.contactDate,     entity.getContactDate());     hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(syContact.updBy,           entity.getUpdBy());           hasAny = true; }
        update.set(syContact.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syContact.contactId.eq(entity.getContactId())).execute();
        return (int) affected;
    }
}
