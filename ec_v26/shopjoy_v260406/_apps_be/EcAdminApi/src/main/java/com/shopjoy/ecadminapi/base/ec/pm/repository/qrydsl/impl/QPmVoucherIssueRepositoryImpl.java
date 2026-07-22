package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmVoucherIssueRepository;
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
/** PmVoucherIssue QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmVoucherIssueRepositoryImpl implements QPmVoucherIssueRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmVoucherIssueRepositoryImpl";
    private static final QPmVoucherIssue pmVoucherIssue    = QPmVoucherIssue.pmVoucherIssue;
    private static final QPmVoucher      pmVoucher  = QPmVoucher.pmVoucher;
    private static final QOdOrder        odOrder  = QOdOrder.odOrder;
    private static final QSySite         sySite  = QSySite.sySite;
    private static final QSyCode         cdVis = new QSyCode("cd_vis");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "issue_date", pmVoucherIssue.issueDate,
        "reg_date", pmVoucherIssue.regDate,
        "upd_date", pmVoucherIssue.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("memberId", pmVoucherIssue.memberId),
        Map.entry("orderId", pmVoucherIssue.orderId),
        Map.entry("siteId", pmVoucherIssue.siteId),
        Map.entry("voucherCode", pmVoucherIssue.voucherCode),
        Map.entry("voucherId", pmVoucherIssue.voucherId),
        Map.entry("voucherIssueId", pmVoucherIssue.voucherIssueId),
        Map.entry("voucherIssueStatusCd", pmVoucherIssue.voucherIssueStatusCd),
        Map.entry("voucherIssueStatusCdBefore", pmVoucherIssue.voucherIssueStatusCdBefore)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * VOUCHER_ISSUE_STATUS  {ISSUED: '발급됨', USED: '사용완료', EXPIRED: '만료', CANCELLED: '취소'}
     */
    private JPAQuery<PmVoucherIssueDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmVoucherIssueDto.Item.class,
                        pmVoucherIssue.voucherIssueId,               // 상품권발급ID (PK)
                        pmVoucherIssue.voucherId,                    // 상품권ID (pm_voucher.voucher_id)
                        pmVoucherIssue.siteId,                       // 사이트ID
                        pmVoucherIssue.memberId,                     // 회원ID (mb_member.member_id)
                        pmVoucherIssue.voucherCode,                  // 발급 고유코드 (UNIQUE)
                        pmVoucherIssue.issueDate,                    // 발급일시
                        pmVoucherIssue.expireDate,                   // 만료일시
                        pmVoucherIssue.useDate,                      // 사용일시
                        pmVoucherIssue.orderId,                      // 사용된 주문ID (od_order.order_id)
                        pmVoucherIssue.useAmt,                       // 실제 사용 할인금액
                        pmVoucherIssue.voucherIssueStatusCd,         // 상태 — VOUCHER_ISSUE_STATUS {ISSUED, USED, EXPIRED, CANCELLED}
                        pmVoucherIssue.voucherIssueStatusCdBefore,   // 변경 전 상태
                        pmVoucherIssue.regBy, pmVoucherIssue.regDate, pmVoucherIssue.updBy, pmVoucherIssue.updDate
                ))
                .from(pmVoucherIssue)
                .leftJoin(pmVoucher).on(pmVoucher.voucherId.eq(pmVoucherIssue.voucherId))
                .leftJoin(odOrder).on(odOrder.orderId.eq(pmVoucherIssue.orderId))
                .leftJoin(sySite).on(sySite.siteId.eq(pmVoucherIssue.siteId))
                .leftJoin(cdVis).on(cdVis.codeGrp.eq("VOUCHER_ISSUE_STATUS").and(cdVis.codeValue.eq(pmVoucherIssue.voucherIssueStatusCd)));
    }

    /* 바우처(상품권) 발행 이력 키조회 */
    @Override
    public Optional<PmVoucherIssueDto.Item> selectById(String voucherIssueId) {
        PmVoucherIssueDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmVoucherIssue.voucherIssueId.eq(voucherIssueId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 바우처(상품권) 발행 이력 목록조회 */
    @Override
    public List<PmVoucherIssueDto.Item> selectList(PmVoucherIssueDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmVoucherIssueDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmVoucherIssue.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmVoucherIssue.voucherIssueId, search.getVoucherIssueId()),
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

    /* 바우처(상품권) 발행 이력 페이지조회 */
    @Override
    public PmVoucherIssueDto.PageResponse selectPageData(PmVoucherIssueDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmVoucherIssue.siteId, search.getSiteId()),
                QdslUtil.strEq(pmVoucherIssue.voucherIssueId, search.getVoucherIssueId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmVoucherIssueDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmVoucherIssueDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmVoucherIssue.count())
                .where(wheres)
                .fetchOne();

        PmVoucherIssueDto.PageResponse res = new PmVoucherIssueDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(PmVoucherIssueDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmVoucherIssueDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmVoucherIssue.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmVoucherIssue.voucherIssueId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("voucherIssueId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmVoucherIssue.voucherIssueId));
                } else if ("issueDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmVoucherIssue.issueDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmVoucherIssue.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmVoucherIssue.voucherIssueId));
        }
        return orders;
    }

    /* 바우처(상품권) 발행 이력 수정 */
    @Override
    public int updateSelective(PmVoucherIssue entity) {
        if (entity.getVoucherIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmVoucherIssue);
        boolean hasAny = false;

        if (entity.getVoucherId()                  != null) { update.set(pmVoucherIssue.voucherId,                  entity.getVoucherId());                  hasAny = true; }
        if (entity.getSiteId()                     != null) { update.set(pmVoucherIssue.siteId,                     entity.getSiteId());                     hasAny = true; }
        if (entity.getMemberId()                   != null) { update.set(pmVoucherIssue.memberId,                   entity.getMemberId());                   hasAny = true; }
        if (entity.getVoucherCode()                != null) { update.set(pmVoucherIssue.voucherCode,                entity.getVoucherCode());                hasAny = true; }
        if (entity.getIssueDate()                  != null) { update.set(pmVoucherIssue.issueDate,                  entity.getIssueDate());                  hasAny = true; }
        if (entity.getExpireDate()                 != null) { update.set(pmVoucherIssue.expireDate,                 entity.getExpireDate());                 hasAny = true; }
        if (entity.getUseDate()                    != null) { update.set(pmVoucherIssue.useDate,                    entity.getUseDate());                    hasAny = true; }
        if (entity.getOrderId()                    != null) { update.set(pmVoucherIssue.orderId,                    entity.getOrderId());                    hasAny = true; }
        if (entity.getUseAmt()                     != null) { update.set(pmVoucherIssue.useAmt,                     entity.getUseAmt());                     hasAny = true; }
        if (entity.getVoucherIssueStatusCd()       != null) { update.set(pmVoucherIssue.voucherIssueStatusCd,       entity.getVoucherIssueStatusCd());       hasAny = true; }
        if (entity.getVoucherIssueStatusCdBefore() != null) { update.set(pmVoucherIssue.voucherIssueStatusCdBefore, entity.getVoucherIssueStatusCdBefore()); hasAny = true; }
        if (entity.getUpdBy()                      != null) { update.set(pmVoucherIssue.updBy,                      entity.getUpdBy());                      hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmVoucherIssue.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmVoucherIssue.voucherIssueId.eq(entity.getVoucherIssueId())).execute();
        return (int) affected;
    }
}
