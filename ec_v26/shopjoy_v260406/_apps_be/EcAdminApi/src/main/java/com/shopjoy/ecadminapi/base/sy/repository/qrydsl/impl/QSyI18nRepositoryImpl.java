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
import com.shopjoy.ecadminapi.base.sy.data.dto.SyI18nDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyI18n;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyI18nRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
/** SyI18n QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyI18nRepositoryImpl implements QSyI18nRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyI18nRepositoryImpl";
    private static final QSyI18n syI18n = QSyI18n.syI18n;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * I18N_SCOPE {FO: '프론트', BO: '관리자', COMMON: '공통'}
     * USE_YN     {Y: '사용', N: '미사용'}
     */
    private JPAQuery<SyI18nDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyI18nDto.Item.class,
                        syI18n.i18nId,         // 다국어ID (YYMMDDhhmmss+rand4)
                        syI18n.i18nKey,        // 다국어 키 (예: common.bt.save, error.FORBIDDEN)
                        syI18n.i18nDesc,       // 키 설명 (번역자 참고용)
                        syI18n.i18nScopeCd,    // 적용범위 — I18N_SCOPE {FO: '프론트', BO: '관리자', COMMON: '공통'}
                        syI18n.i18nCategory,   // 키 첫 세그먼트 (common/error/link/paging 등)
                        /* 언어별 메시지 — 2026-08-13 sy_i18n_msg 통합.
                           여기 빠지면 화면이 번역을 받지 못해 빈칸으로 보인다(에러는 안 난다). */
                        syI18n.i18nMsgKo,      // 한국어 메시지
                        syI18n.i18nMsgEn,      // 영어 메시지
                        syI18n.i18nMsgCn,      // 중국어 메시지
                        syI18n.i18nMsgJa,      // 일본어 메시지
                        syI18n.sortOrd,        // 정렬순서
                        syI18n.useYn,          // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        syI18n.regBy,          // 등록자
                        syI18n.regDate,        // 등록일시
                        syI18n.updBy,          // 수정자
                        syI18n.updDate        // 수정일시
                ))
                .from(syI18n);
    }

    /* 다국어 키조회 */
    @Override
    public Optional<SyI18nDto.Item> selectById(String i18nId) {
        SyI18nDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syI18n.i18nId.eq(i18nId)).fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 다국어 목록조회 */
    @Override
    public List<SyI18nDto.Item> selectList(SyI18nDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syI18n.i18nId, search.getI18nId()));
        whereList.add(QdslUtil.strEq(syI18n.i18nScopeCd, search.getI18nScopeCd()));
        whereList.add(QdslUtil.strEq(syI18n.useYn, search.getUseYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyI18nDto.Item> query = baseSelColumnQuery()
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
        List<SyI18nDto.Item> list = query.fetch();
        return list;
    }

    /* 다국어 페이지조회 */
    @Override
    public BasePage<SyI18nDto.Item> selectPageData(SyI18nDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syI18n.i18nId, search.getI18nId()));
        whereList.add(QdslUtil.strEq(syI18n.i18nScopeCd, search.getI18nScopeCd()));
        whereList.add(QdslUtil.strEq(syI18n.useYn, search.getUseYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<SyI18nDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyI18nDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syI18n.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyI18nDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("i18nCategory", syI18n.i18nCategory),
            QdslUtil.FieldDef.like("i18nDesc", syI18n.i18nDesc),
            QdslUtil.FieldDef.like("i18nId", syI18n.i18nId),
            QdslUtil.FieldDef.like("i18nKey", syI18n.i18nKey),
            /* 번역 본문으로도 찾을 수 있게 — "저장" 으로 검색해 해당 키를 찾는 용도 */
            QdslUtil.FieldDef.like("i18nMsgKo", syI18n.i18nMsgKo),
            QdslUtil.FieldDef.like("i18nMsgEn", syI18n.i18nMsgEn),
            QdslUtil.FieldDef.like("i18nMsgCn", syI18n.i18nMsgCn),
            QdslUtil.FieldDef.like("i18nMsgJa", syI18n.i18nMsgJa),
            QdslUtil.FieldDef.like("i18nScopeCd", syI18n.i18nScopeCd),
            QdslUtil.FieldDef.like("useYn", syI18n.useYn)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("i18nId", syI18n.i18nId,
                   "regDate", syI18n.regDate,
                   "sortOrd", syI18n.sortOrd),
        new OrderSpecifier<>(Order.ASC, syI18n.sortOrd),
        new OrderSpecifier<>(Order.ASC, syI18n.regDate),
        new OrderSpecifier<>(Order.ASC, syI18n.i18nId));
    }

    /* 다국어 수정 */
    @Override
    public int updateSelective(SyI18n entity) {
        if (entity.getI18nId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syI18n);
        boolean hasAny = false;

        if (entity.getI18nKey()      != null) { update.set(syI18n.i18nKey,      entity.getI18nKey());      hasAny = true; }
        if (entity.getI18nDesc()     != null) { update.set(syI18n.i18nDesc,     entity.getI18nDesc());     hasAny = true; }
        if (entity.getI18nScopeCd()  != null) { update.set(syI18n.i18nScopeCd,  entity.getI18nScopeCd());  hasAny = true; }
        if (entity.getI18nCategory() != null) { update.set(syI18n.i18nCategory, entity.getI18nCategory()); hasAny = true; }
        if (entity.getSortOrd()      != null) { update.set(syI18n.sortOrd,      entity.getSortOrd());      hasAny = true; }
        if (entity.getUseYn()        != null) { update.set(syI18n.useYn,        entity.getUseYn());        hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(syI18n.updBy,        entity.getUpdBy());        hasAny = true; }
        update.set(syI18n.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syI18n.i18nId.eq(entity.getI18nId())).execute();
        return (int) affected;
    }
}
