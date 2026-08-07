package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.od.data.entity.QOdOrder;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherIssueDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucherIssue;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmVoucherIssueRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
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
    private static final QVwSyCode         cdVis = new QVwSyCode("cd_vis");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("issue_date", pmVoucherIssue.issueDate,
        "reg_date", pmVoucherIssue.regDate,
        "upd_date", pmVoucherIssue.updDate
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
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<PmVoucherIssueDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmVoucherIssue.voucherIssueId, search.getVoucherIssueId()),
                    QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
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

    /* 바우처(상품권) 발행 이력 페이지조회 */
    @Override
    public BasePage<PmVoucherIssueDto.Item> selectPageData(PmVoucherIssueDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmVoucherIssue.voucherIssueId, search.getVoucherIssueId()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
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

        BasePage<PmVoucherIssueDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("memberId", pmVoucherIssue.memberId),
            QdslUtil.FieldDef.like("orderId", pmVoucherIssue.orderId),
            QdslUtil.FieldDef.like("voucherCode", pmVoucherIssue.voucherCode),
            QdslUtil.FieldDef.like("voucherId", pmVoucherIssue.voucherId),
            QdslUtil.FieldDef.like("voucherIssueId", pmVoucherIssue.voucherIssueId),
            QdslUtil.FieldDef.like("voucherIssueStatusCd", pmVoucherIssue.voucherIssueStatusCd),
            QdslUtil.FieldDef.like("voucherIssueStatusCdBefore", pmVoucherIssue.voucherIssueStatusCdBefore)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("voucherIssueId", pmVoucherIssue.voucherIssueId,
                   "issueDate", pmVoucherIssue.issueDate),
        new OrderSpecifier<>(Order.DESC, pmVoucherIssue.regDate),
        new OrderSpecifier<>(Order.ASC, pmVoucherIssue.voucherIssueId));
    }

    /* 바우처(상품권) 발행 이력 수정 */
    @Override
    public int updateSelective(PmVoucherIssue entity) {
        if (entity.getVoucherIssueId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmVoucherIssue);
        boolean hasAny = false;

        if (entity.getVoucherId()                  != null) { update.set(pmVoucherIssue.voucherId,                  entity.getVoucherId());                  hasAny = true; }
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
