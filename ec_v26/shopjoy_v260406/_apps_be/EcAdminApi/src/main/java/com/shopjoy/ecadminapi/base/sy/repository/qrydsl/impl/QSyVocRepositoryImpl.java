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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyVocDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyVoc;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVoc;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyVocRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyVoc QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyVocRepositoryImpl implements QSyVocRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyVocRepositoryImpl";
    private static final QSyVoc syVoc = QSyVoc.syVoc;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * VOC_MASTER  {DELIVERY: '배송', PRODUCT: '상품', PAYMENT: '결제', CLAIM: '클레임', SERVICE: '서비스', ETC: '기타'}
     * VOC_DETAIL  {DELIVERY_DELAY: '배송지연', PRODUCT_DEFECT: '상품불량', PAYMENT_FAIL: '결제실패', CLAIM_RETURN: '반품처리', ETC: '기타' 등}
     */
    /* 고객의 소리(VOC) baseSelColumnQuery */
    private JPAQuery<SyVocDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyVocDto.Item.class,
                        syVoc.vocId,           // VOC분류ID (PK, YYMMDDhhmmss+rand4)
                        syVoc.vocMasterCd,     // VOC마스터코드 — VOC_MASTER {DELIVERY: '배송', PRODUCT: '상품', PAYMENT: '결제', CLAIM: '클레임', SERVICE: '서비스', ETC: '기타'}
                        syVoc.vocDetailCd,     // VOC세부코드 — VOC_DETAIL {DELIVERY_DELAY: '배송지연', PRODUCT_DEFECT: '상품불량', PAYMENT_FAIL: '결제실패', CLAIM_RETURN: '반품처리', ETC: '기타' 등}
                        syVoc.vocNm,           // VOC항목명
                        syVoc.vocContent,      // VOC항목설명
                        syVoc.useYn,           // 사용여부 Y/N
                        syVoc.regBy,           // 등록자
                        syVoc.regDate,         // 등록일시
                        syVoc.updBy,           // 수정자
                        syVoc.updDate         // 수정일시
                ))
                .from(syVoc);
    }

    /* 고객의 소리(VOC) 키조회 */
    @Override
    public Optional<SyVocDto.Item> selectById(String vocId) {
        SyVocDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syVoc.vocId.eq(vocId)).fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 고객의 소리(VOC) 목록조회 */
    @Override
    public List<SyVocDto.Item> selectList(SyVocDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syVoc.vocId, search.getVocId()));
        whereList.add(QdslUtil.strEq(syVoc.vocMasterCd, search.getVocMasterCd()));
        whereList.add(QdslUtil.strEq(syVoc.vocDetailCd, search.getVocDetailCd()));
        whereList.add(QdslUtil.strEq(syVoc.useYn, search.getUseYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyVocDto.Item> query = baseSelColumnQuery()
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
        return query.fetch();
    }

    /* 고객의 소리(VOC) 페이지조회 */
    @Override
    public BasePage<SyVocDto.Item> selectPageData(SyVocDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syVoc.vocId, search.getVocId()));
        whereList.add(QdslUtil.strEq(syVoc.vocMasterCd, search.getVocMasterCd()));
        whereList.add(QdslUtil.strEq(syVoc.vocDetailCd, search.getVocDetailCd()));
        whereList.add(QdslUtil.strEq(syVoc.useYn, search.getUseYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<SyVocDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyVocDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syVoc.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyVocDto.Item> res = new BasePage<>();
        return res.setPageInfo(content, CmUtil.nvlLong(total), pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("useYn", syVoc.useYn),
            QdslUtil.FieldDef.like("vocContent", syVoc.vocContent),
            QdslUtil.FieldDef.like("vocDetailCd", syVoc.vocDetailCd),
            QdslUtil.FieldDef.like("vocId", syVoc.vocId),
            QdslUtil.FieldDef.like("vocMasterCd", syVoc.vocMasterCd),
            QdslUtil.FieldDef.like("vocNm", syVoc.vocNm)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("vocId", syVoc.vocId,
                   "vocNm", syVoc.vocNm,
                   "regDate", syVoc.regDate),
        new OrderSpecifier<>(Order.DESC, syVoc.regDate),
        new OrderSpecifier<>(Order.ASC, syVoc.vocId));
    }

    /* 고객의 소리(VOC) 수정 */
    @Override
    public int updateSelective(SyVoc entity) {
        if (entity.getVocId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syVoc);
        boolean hasAny = false;

        if (entity.getVocMasterCd() != null) { update.set(syVoc.vocMasterCd, entity.getVocMasterCd()); hasAny = true; }
        if (entity.getVocDetailCd() != null) { update.set(syVoc.vocDetailCd, entity.getVocDetailCd()); hasAny = true; }
        if (entity.getVocNm()       != null) { update.set(syVoc.vocNm,       entity.getVocNm());       hasAny = true; }
        if (entity.getVocContent()  != null) { update.set(syVoc.vocContent,  entity.getVocContent());  hasAny = true; }
        if (entity.getUseYn()       != null) { update.set(syVoc.useYn,       entity.getUseYn());       hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(syVoc.updBy,       entity.getUpdBy());       hasAny = true; }
        update.set(syVoc.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syVoc.vocId.eq(entity.getVocId())).execute();
        return (int) affected;
    }
}
