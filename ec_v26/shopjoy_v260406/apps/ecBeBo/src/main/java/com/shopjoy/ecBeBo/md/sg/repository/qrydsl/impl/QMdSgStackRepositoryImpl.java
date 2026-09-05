package com.shopjoy.ecBeBo.md.sg.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecBeBo.md.sg.data.dto.MdSgStackDto;
import com.shopjoy.ecBeBo.md.sg.data.entity.MdSgStack;
import com.shopjoy.ecBeBo.md.sg.data.entity.QMdSgStack;
import com.shopjoy.ecBeBo.md.sg.repository.qrydsl.QMdSgStackRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;

/** MdSgStack(소스젠 언어/스택 카탈로그) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMdSgStackRepositoryImpl implements QMdSgStackRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "md.sg.repository.qrydsl.impl.QMdSgStackRepositoryImpl";
    private static final QMdSgStack mdSgStack = QMdSgStack.mdSgStack;

    private JPAQuery<MdSgStackDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MdSgStackDto.Item.class,
                        mdSgStack.stackId,          // 스택ID (PK)
                        mdSgStack.categoryCd,       // 구획
                        mdSgStack.stackNm,          // 화면 표시명
                        mdSgStack.stackPrefix,      // 생성 파일 경로 접두어
                        mdSgStack.versionList,      // 선택 가능 버전 목록
                        mdSgStack.defaultVersion,   // 기본 선택 버전
                        mdSgStack.sortOrd,          // 정렬순서
                        mdSgStack.useYn,            // 사용여부
                        mdSgStack.regBy, mdSgStack.regDate, mdSgStack.updBy, mdSgStack.updDate,
                        mdSgStack.siteId
                ))
                .from(mdSgStack)
                ;
    }

    @Override
    public Optional<MdSgStackDto.Item> selectById(String stackId) {
        MdSgStackDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mdSgStack.stackId.eq(stackId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    @Override
    public List<MdSgStackDto.Item> selectList(MdSgStackDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = buildWheres(search);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MdSgStackDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo   = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            query.offset((pageNo - 1) * pageSize).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public BasePage<MdSgStackDto.Item> selectPageData(MdSgStackDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        BooleanExpression[] wheres = buildWheres(search);

        JPAQuery<MdSgStackDto.Item> query = baseSelColumnQuery();
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MdSgStackDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres).orderBy(orders).offset(offset).limit(pageSize).fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mdSgStack.count()).where(wheres).fetchOne();

        BasePage<MdSgStackDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /** buildWheres — selectList / selectPageData 공통 검색 조건 */
    private BooleanExpression[] buildWheres(MdSgStackDto.Request search) {
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mdSgStack.siteId, search.getSiteId()));
        whereList.add(QdslUtil.strEq(mdSgStack.categoryCd, search.getCategoryCd()));
        whereList.add(QdslUtil.strEq(mdSgStack.useYn, search.getUseYn()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        return whereList.toArray(BooleanExpression[]::new);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("stackNm", mdSgStack.stackNm),
            QdslUtil.FieldDef.like("stackPrefix", mdSgStack.stackPrefix)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("stackNm", mdSgStack.stackNm,
                   "categoryCd", mdSgStack.categoryCd,
                   "sortOrd", mdSgStack.sortOrd),
        new OrderSpecifier<>(Order.ASC, mdSgStack.categoryCd),
        new OrderSpecifier<>(Order.ASC, mdSgStack.sortOrd),
        new OrderSpecifier<>(Order.ASC, mdSgStack.stackId));
    }

    @Override
    public int updateSelective(MdSgStack entity) {
        if (entity.getStackId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mdSgStack);
        boolean hasAny = false;

        if (entity.getCategoryCd()    != null) { update.set(mdSgStack.categoryCd,    entity.getCategoryCd());    hasAny = true; }
        if (entity.getStackNm()       != null) { update.set(mdSgStack.stackNm,       entity.getStackNm());       hasAny = true; }
        if (entity.getStackPrefix()   != null) { update.set(mdSgStack.stackPrefix,   entity.getStackPrefix());   hasAny = true; }
        if (entity.getVersionList()   != null) { update.set(mdSgStack.versionList,   entity.getVersionList());   hasAny = true; }
        if (entity.getDefaultVersion()!= null) { update.set(mdSgStack.defaultVersion,entity.getDefaultVersion());hasAny = true; }
        if (entity.getSortOrd()       != null) { update.set(mdSgStack.sortOrd,       entity.getSortOrd());       hasAny = true; }
        if (entity.getUseYn()         != null) { update.set(mdSgStack.useYn,         entity.getUseYn());         hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(mdSgStack.updBy,         entity.getUpdBy());         hasAny = true; }
        update.set(mdSgStack.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;
        long affected = update.where(mdSgStack.stackId.eq(entity.getStackId())).execute();
        return (int) affected;
    }
}
