package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleCloseRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** StSettleClose QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStSettleCloseRepositoryImpl implements QStSettleCloseRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStSettleCloseRepositoryImpl";
    private static final QStSettleClose stSettleClose   = QStSettleClose.stSettleClose;
    private static final QSySite        sySite = QSySite.sySite;
    private static final QSyCode        cdScs = new QSyCode("cd_scs");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", stSettleClose.regDate,
        "upd_date", stSettleClose.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("closeBy", stSettleClose.closeBy),
        Map.entry("closeReason", stSettleClose.closeReason),
        Map.entry("closeStatusCd", stSettleClose.closeStatusCd),
        Map.entry("settleCloseId", stSettleClose.settleCloseId),
        Map.entry("settleId", stSettleClose.settleId),
        Map.entry("siteId", stSettleClose.siteId)
    );

    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 실 데이터 기준)
     * SETTLE_CLOSE_STATUS  {DRAFT: '임시마감', CONFIRMED: '확정마감', PAID: '지급완료'}
     * (Entity 주석상 closeStatusCd 흐름: CLOSED/REOPENED — sy_code 실 데이터와 값 표기가 다름)
     */
    private JPAQuery<StSettleCloseDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StSettleCloseDto.Item.class,
                        stSettleClose.settleCloseId,     // 마감이력ID (PK)
                        stSettleClose.settleId,           // 정산ID (st_settle.settle_id)
                        stSettleClose.siteId,             // 사이트ID
                        stSettleClose.closeStatusCd,      // 마감상태 — SETTLE_CLOSE_STATUS {DRAFT: '임시마감', CONFIRMED: '확정마감', PAID: '지급완료'}
                        stSettleClose.closeReason,        // 마감/재오픈 사유
                        stSettleClose.finalSettleAmt,     // 마감 시점 최종정산금액 스냅샷
                        stSettleClose.closeBy,            // 처리자 (sy_user.user_id)
                        stSettleClose.closeDate,          // 처리일시
                        stSettleClose.regBy,              // 등록자
                        stSettleClose.regDate,            // 등록일시
                        sySite.siteNm.as("siteNm"),                   // 사이트명 (조인)
                        cdScs.codeLabel.as("closeStatusCdNm")         // 마감상태명 (sy_code 조인)
                ))
                .from(stSettleClose)
                .leftJoin(sySite).on(sySite.siteId.eq(stSettleClose.siteId))
                .leftJoin(cdScs).on(cdScs.codeGrp.eq("SETTLE_CLOSE_STATUS").and(cdScs.codeValue.eq(stSettleClose.closeStatusCd)));
    }

    /* 정산 마감 키조회 */
    @Override
    public Optional<StSettleCloseDto.Item> selectById(String id) {
        StSettleCloseDto.Item dto = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stSettleClose.settleCloseId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 정산 마감 목록조회 */
    @Override
    public List<StSettleCloseDto.Item> selectList(StSettleCloseDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<StSettleCloseDto.Item> query = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(stSettleClose.siteId, search.getSiteId()),
                    QdslUtil.strEq(stSettleClose.settleCloseId, search.getSettleCloseId()),
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

    /* 정산 마감 페이지조회 */
    @Override
    public StSettleCloseDto.PageResponse selectPageData(StSettleCloseDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(stSettleClose.siteId, search.getSiteId()),
                QdslUtil.strEq(stSettleClose.settleCloseId, search.getSettleCloseId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<StSettleCloseDto.Item> query = baseListQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<StSettleCloseDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stSettleClose.count())
                .where(wheres)
                .fetchOne();

        StSettleCloseDto.PageResponse res = new StSettleCloseDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(StSettleCloseDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(StSettleCloseDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, stSettleClose.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleClose.settleCloseId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("settleCloseId".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleClose.settleCloseId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, stSettleClose.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, stSettleClose.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, stSettleClose.settleCloseId));
        }
        return orders;
    }

    /* 정산 마감 수정 */
    @Override
    public int updateSelective(StSettleClose entity) {
        if (entity.getSettleCloseId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stSettleClose);
        boolean hasAny = false;

        if (entity.getSettleId()      != null) { update.set(stSettleClose.settleId,      entity.getSettleId());      hasAny = true; }
        if (entity.getSiteId()        != null) { update.set(stSettleClose.siteId,        entity.getSiteId());        hasAny = true; }
        if (entity.getCloseStatusCd() != null) { update.set(stSettleClose.closeStatusCd, entity.getCloseStatusCd()); hasAny = true; }
        if (entity.getCloseReason()   != null) { update.set(stSettleClose.closeReason,   entity.getCloseReason());   hasAny = true; }
        if (entity.getFinalSettleAmt()!= null) { update.set(stSettleClose.finalSettleAmt,entity.getFinalSettleAmt());hasAny = true; }
        if (entity.getCloseBy()       != null) { update.set(stSettleClose.closeBy,       entity.getCloseBy());       hasAny = true; }
        if (entity.getCloseDate()     != null) { update.set(stSettleClose.closeDate,     entity.getCloseDate());     hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(stSettleClose.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(stSettleClose.settleCloseId.eq(entity.getSettleCloseId())).execute();
        return (int) affected;
    }
}
