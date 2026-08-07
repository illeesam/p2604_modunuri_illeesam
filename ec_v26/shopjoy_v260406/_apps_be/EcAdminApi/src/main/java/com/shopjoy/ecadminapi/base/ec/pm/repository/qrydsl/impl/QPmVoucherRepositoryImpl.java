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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmVoucher;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmVoucherRepository;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** PmVoucher QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmVoucherRepositoryImpl implements QPmVoucherRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmVoucherRepositoryImpl";
    private static final QPmVoucher pmVoucher    = QPmVoucher.pmVoucher;
    private static final QSySite    sySite  = QSySite.sySite;
    private static final QVwSyCode    cdVt = new QVwSyCode("cd_vt");
    private static final QVwSyCode    cdVs = new QVwSyCode("cd_vs");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_RANGE_FIELDS = Map.of("reg_date", pmVoucher.regDate,
        "upd_date", pmVoucher.updDate
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * VOUCHER_TYPE    {AMOUNT: '금액권', RATE: '정률권'}
     * VOUCHER_STATUS  {ACTIVE: '활성', INACTIVE: '비활성', EXPIRED: '만료'}
     */
    private JPAQuery<PmVoucherDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmVoucherDto.Item.class,
                        pmVoucher.voucherId,               // 상품권ID (PK, YYMMDDhhmmss+rand4)
                        pmVoucher.voucherNm,               // 상품권명
                        pmVoucher.voucherTypeCd,           // 유형 — VOUCHER_TYPE {AMOUNT: '금액권', RATE: '정률권'}
                        pmVoucher.voucherValue,            // 권면금액 또는 할인율
                        pmVoucher.minOrderAmt,             // 사용 최소주문금액
                        pmVoucher.maxDiscntAmt,            // 최대할인한도 (정률권)
                        pmVoucher.expireMonth,             // 유효기간 (발급 후 N개월, NULL=무제한)
                        pmVoucher.voucherStatusCd,         // 상태 — VOUCHER_STATUS {ACTIVE: '활성', INACTIVE: '비활성', EXPIRED: '만료'}
                        pmVoucher.voucherStatusCdBefore,   // 변경 전 상태
                        pmVoucher.voucherDesc,             // 상품권 설명
                        pmVoucher.useYn, pmVoucher.regBy, pmVoucher.regDate, pmVoucher.updBy, pmVoucher.updDate
                ))
                .from(pmVoucher)
                .leftJoin(cdVt).on(cdVt.codeGrp.eq("VOUCHER_TYPE").and(cdVt.codeValue.eq(pmVoucher.voucherTypeCd)))
                .leftJoin(cdVs).on(cdVs.codeGrp.eq("VOUCHER_STATUS").and(cdVs.codeValue.eq(pmVoucher.voucherStatusCd)));
    }

    /* 바우처(상품권) 키조회 */
    @Override
    public Optional<PmVoucherDto.Item> selectById(String voucherId) {
        PmVoucherDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmVoucher.voucherId.eq(voucherId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 바우처(상품권) 목록조회 */
    @Override
    public List<PmVoucherDto.Item> selectList(PmVoucherDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        JPAQuery<PmVoucherDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmVoucher.voucherId, search.getVoucherId()),
                    QdslUtil.strEq(pmVoucher.voucherStatusCd, search.getVoucherStatusCd()),
                    QdslUtil.strEq(pmVoucher.useYn, search.getUseYn()),
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

    /* 바우처(상품권) 페이지조회 */
    @Override
    public BasePage<PmVoucherDto.Item> selectPageData(PmVoucherDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmVoucher.voucherId, search.getVoucherId()),
                QdslUtil.strEq(pmVoucher.voucherStatusCd, search.getVoucherStatusCd()),
                QdslUtil.strEq(pmVoucher.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateRangeType(), search.getDateRangeStart(), search.getDateRangeEnd(), DATE_RANGE_FIELDS),
                andSearchValue(search.getSearchValue(), search.getSearchType())
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmVoucherDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmVoucherDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmVoucher.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmVoucherDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }

    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("useYn", pmVoucher.useYn),
            QdslUtil.FieldDef.like("voucherDesc", pmVoucher.voucherDesc),
            QdslUtil.FieldDef.like("voucherId", pmVoucher.voucherId),
            QdslUtil.FieldDef.like("voucherNm", pmVoucher.voucherNm),
            QdslUtil.FieldDef.like("voucherStatusCd", pmVoucher.voucherStatusCd),
            QdslUtil.FieldDef.like("voucherStatusCdBefore", pmVoucher.voucherStatusCdBefore),
            QdslUtil.FieldDef.like("voucherTypeCd", pmVoucher.voucherTypeCd)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("voucherId", pmVoucher.voucherId,
                   "voucherNm", pmVoucher.voucherNm,
                   "regDate", pmVoucher.regDate),
        new OrderSpecifier<>(Order.DESC, pmVoucher.regDate),
        new OrderSpecifier<>(Order.ASC, pmVoucher.voucherId));
    }

    /* 바우처(상품권) 수정 */
    @Override
    public int updateSelective(PmVoucher entity) {
        if (entity.getVoucherId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmVoucher);
        boolean hasAny = false;

        if (entity.getVoucherNm()             != null) { update.set(pmVoucher.voucherNm,             entity.getVoucherNm());             hasAny = true; }
        if (entity.getVoucherTypeCd()         != null) { update.set(pmVoucher.voucherTypeCd,         entity.getVoucherTypeCd());         hasAny = true; }
        if (entity.getVoucherValue()          != null) { update.set(pmVoucher.voucherValue,          entity.getVoucherValue());          hasAny = true; }
        if (entity.getMinOrderAmt()           != null) { update.set(pmVoucher.minOrderAmt,           entity.getMinOrderAmt());           hasAny = true; }
        if (entity.getMaxDiscntAmt()          != null) { update.set(pmVoucher.maxDiscntAmt,          entity.getMaxDiscntAmt());          hasAny = true; }
        if (entity.getExpireMonth()           != null) { update.set(pmVoucher.expireMonth,           entity.getExpireMonth());           hasAny = true; }
        if (entity.getVoucherStatusCd()       != null) { update.set(pmVoucher.voucherStatusCd,       entity.getVoucherStatusCd());       hasAny = true; }
        if (entity.getVoucherStatusCdBefore() != null) { update.set(pmVoucher.voucherStatusCdBefore, entity.getVoucherStatusCdBefore()); hasAny = true; }
        if (entity.getVoucherDesc()           != null) { update.set(pmVoucher.voucherDesc,           entity.getVoucherDesc());           hasAny = true; }
        if (entity.getUseYn()                 != null) { update.set(pmVoucher.useYn,                 entity.getUseYn());                 hasAny = true; }
        if (entity.getUpdBy()                 != null) { update.set(pmVoucher.updBy,                 entity.getUpdBy());                 hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmVoucher.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmVoucher.voucherId.eq(entity.getVoucherId())).execute();
        return (int) affected;
    }
}
