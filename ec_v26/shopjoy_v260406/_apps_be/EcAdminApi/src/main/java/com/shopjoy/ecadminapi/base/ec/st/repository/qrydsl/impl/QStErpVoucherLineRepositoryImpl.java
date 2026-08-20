package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherLineDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.QStErpVoucherLine;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucherLine;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStErpVoucherLineRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** StErpVoucherLine(ERP 전표 라인 (분개 항목, 차변/대변 1행씩)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QStErpVoucherLineRepositoryImpl implements QStErpVoucherLineRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.st.repository.qrydsl.impl.QStErpVoucherLineRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QStErpVoucherLine stErpVoucherLine = QStErpVoucherLine.stErpVoucherLine;    /*
     * baseListQuery — 코드성 필드 예시 코드값 (sy_code 미등록, Entity 주석 기준 참고값)
     * REF_TYPE_CD  {SETTLE: '정산', ORDER: '주문', CLAIM: '클레임', PAY: '지급', ADJ: '조정'}
     */
    private JPAQuery<StErpVoucherLineDto.Item> baseListQuery() {
        return queryFactory
                .select(Projections.bean(StErpVoucherLineDto.Item.class,
                        stErpVoucherLine.erpVoucherLineId,   // 전표라인ID (PK, YYMMDDhhmmss+rand4)
                        stErpVoucherLine.erpVoucherId,       // ERP전표ID (st_erp_voucher.erp_voucher_id)
                        stErpVoucherLine.lineNo,             // 라인 순번 (전표 내 고유)
                        stErpVoucherLine.accountCd,          // 계정코드 (ERP 계정과목 코드)
                        stErpVoucherLine.accountNm,          // 계정명 스냅샷
                        stErpVoucherLine.costCenterCd,       // 코스트센터 코드
                        stErpVoucherLine.profitCenterCd,     // 수익센터 코드
                        stErpVoucherLine.debitAmt,           // 차변 금액 (대변과 상호 배타적)
                        stErpVoucherLine.creditAmt,          // 대변 금액 (차변과 상호 배타적)
                        stErpVoucherLine.refTypeCd,          // 참조유형 — REF_TYPE_CD {SETTLE: '정산', ORDER: '주문', CLAIM: '클레임', PAY: '지급', ADJ: '조정'}
                        stErpVoucherLine.refId,              // 참조ID (settle_id / order_id / claim_id 등)
                        stErpVoucherLine.lineMemo,           // 라인 적요
                        stErpVoucherLine.regBy,              // 등록자
                        stErpVoucherLine.regDate,             // 등록일시
                        stErpVoucherLine.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(stErpVoucherLine)
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(stErpVoucherLine.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(stErpVoucherLine.regBy)) // 등록자
                ;
    }

    /* ERP 전표 상세 키조회 */
    @Override
    public Optional<StErpVoucherLineDto.Item> selectById(String id) {
        StErpVoucherLineDto.Item dtl = baseListQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(stErpVoucherLine.erpVoucherLineId.eq(id))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* ERP 전표 상세 목록조회 */
    @Override
    public List<StErpVoucherLineDto.Item> selectList(StErpVoucherLineDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stErpVoucherLine.erpVoucherLineId, search.getErpVoucherLineId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stErpVoucherLine.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stErpVoucherLine.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<StErpVoucherLineDto.Item> query = baseListQuery()
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
        List<StErpVoucherLineDto.Item> list = query.fetch();
        return list;
    }

    /* ERP 전표 상세 페이지조회 */
    @Override
    public BasePage<StErpVoucherLineDto.Item> selectPageData(StErpVoucherLineDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(stErpVoucherLine.erpVoucherLineId, search.getErpVoucherLineId()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stErpVoucherLine.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(stErpVoucherLine.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<StErpVoucherLineDto.Item> query = baseListQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<StErpVoucherLineDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(stErpVoucherLine.count())
                .where(wheres)
                .fetchOne();

        BasePage<StErpVoucherLineDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("accountCd", stErpVoucherLine.accountCd),
            QdslUtil.FieldDef.like("accountNm", stErpVoucherLine.accountNm),
            QdslUtil.FieldDef.like("costCenterCd", stErpVoucherLine.costCenterCd),
            QdslUtil.FieldDef.like("erpVoucherId", stErpVoucherLine.erpVoucherId),
            QdslUtil.FieldDef.like("erpVoucherLineId", stErpVoucherLine.erpVoucherLineId),
            QdslUtil.FieldDef.like("lineMemo", stErpVoucherLine.lineMemo),
            QdslUtil.FieldDef.like("profitCenterCd", stErpVoucherLine.profitCenterCd),
            QdslUtil.FieldDef.like("refId", stErpVoucherLine.refId),
            QdslUtil.FieldDef.like("refTypeCd", stErpVoucherLine.refTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("erpVoucherLineId", stErpVoucherLine.erpVoucherLineId,
                   "accountNm", stErpVoucherLine.accountNm,
                   "regDate", stErpVoucherLine.regDate),
        new OrderSpecifier<>(Order.DESC, stErpVoucherLine.regDate),
        new OrderSpecifier<>(Order.ASC, stErpVoucherLine.erpVoucherLineId));
    }

    /* ERP 전표 상세 수정 */
    @Override
    public int updateSelective(StErpVoucherLine entity) {
        if (entity.getErpVoucherLineId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(stErpVoucherLine);
        boolean hasAny = false;

        if (entity.getErpVoucherId()  != null) { update.set(stErpVoucherLine.erpVoucherId,  entity.getErpVoucherId());  hasAny = true; }
        if (entity.getLineNo()        != null) { update.set(stErpVoucherLine.lineNo,        entity.getLineNo());        hasAny = true; }
        if (entity.getAccountCd()     != null) { update.set(stErpVoucherLine.accountCd,     entity.getAccountCd());     hasAny = true; }
        if (entity.getAccountNm()     != null) { update.set(stErpVoucherLine.accountNm,     entity.getAccountNm());     hasAny = true; }
        if (entity.getCostCenterCd()  != null) { update.set(stErpVoucherLine.costCenterCd,  entity.getCostCenterCd());  hasAny = true; }
        if (entity.getProfitCenterCd()!= null) { update.set(stErpVoucherLine.profitCenterCd,entity.getProfitCenterCd());hasAny = true; }
        if (entity.getDebitAmt()      != null) { update.set(stErpVoucherLine.debitAmt,      entity.getDebitAmt());      hasAny = true; }
        if (entity.getCreditAmt()     != null) { update.set(stErpVoucherLine.creditAmt,     entity.getCreditAmt());     hasAny = true; }
        if (entity.getRefTypeCd()     != null) { update.set(stErpVoucherLine.refTypeCd,     entity.getRefTypeCd());     hasAny = true; }
        if (entity.getRefId()         != null) { update.set(stErpVoucherLine.refId,         entity.getRefId());         hasAny = true; }
        if (entity.getLineMemo()      != null) { update.set(stErpVoucherLine.lineMemo,      entity.getLineMemo());      hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(stErpVoucherLine.erpVoucherLineId.eq(entity.getErpVoucherLineId())).execute();
        return (int) affected;
    }
}
