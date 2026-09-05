package com.shopjoy.ecBeBo.md.cb.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.md.cb.data.dto.MdCbYarnDto;
import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbYarn;
import com.shopjoy.ecBeBo.md.cb.data.entity.QMdCbYarn;
import com.shopjoy.ecBeBo.md.cb.repository.qrydsl.QMdCbYarnRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;

/** MdCbYarn(실) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMdCbYarnRepositoryImpl implements QMdCbYarnRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "md.cb.repository.qrydsl.impl.QMdCbYarnRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QMdCbYarn mdCbYarn = QMdCbYarn.mdCbYarn;
    private static final QVwSyCode codeWeightCd = new QVwSyCode("cd_wt");

    private JPAQuery<MdCbYarnDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MdCbYarnDto.Item.class,
                        mdCbYarn.yarnId,       // 실ID (PK)
                        mdCbYarn.yarnNm,       // 실 이름
                        mdCbYarn.colorHex,     // 실 색상
                        mdCbYarn.weightCd,     // 실 굵기
                        codeWeightCd.codeLabel.as("weightCdNm"),  // 실 굵기 코드라벨 (조인)
                        mdCbYarn.brandNm,      // 실 브랜드명
                        mdCbYarn.useYn,        // 사용여부 Y/N
                        mdCbYarn.regBy, mdCbYarn.regDate, mdCbYarn.updBy, mdCbYarn.updDate,
                        mdCbYarn.regSiteId,
                        regSiteEx.siteNm.as("regSiteNm"),
                        regUserEx.userNm.as("regUserNm"),
                        mdCbYarn.siteId,
                        siteEx.siteNm.as("siteNm")
                ))
                .from(mdCbYarn)
                .leftJoin(codeWeightCd).on(codeWeightCd.codeGrp.eq("CB_YARN_WEIGHT_CD").and(codeWeightCd.codeValue.eq(mdCbYarn.weightCd)))
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(mdCbYarn.regSiteId))
                .leftJoin(regUserEx).on(regUserEx.userId.eq(mdCbYarn.regBy))
                .leftJoin(siteEx).on(siteEx.siteId.eq(mdCbYarn.siteId))
                ;
    }

    @Override
    public Optional<MdCbYarnDto.Item> selectById(String yarnId) {
        MdCbYarnDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mdCbYarn.yarnId.eq(yarnId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    @Override
    public List<MdCbYarnDto.Item> selectList(MdCbYarnDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mdCbYarn.yarnId, search.getYarnId()));
        whereList.add(QdslUtil.strEq(mdCbYarn.weightCd, search.getWeightCd()));
        whereList.add(QdslUtil.strEq(mdCbYarn.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbYarn.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbYarn.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mdCbYarn.siteId, search.getSiteId()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MdCbYarnDto.Item> query = baseSelColumnQuery()
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
    public BasePage<MdCbYarnDto.Item> selectPageData(MdCbYarnDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mdCbYarn.yarnId, search.getYarnId()));
        whereList.add(QdslUtil.strEq(mdCbYarn.weightCd, search.getWeightCd()));
        whereList.add(QdslUtil.strEq(mdCbYarn.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbYarn.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbYarn.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mdCbYarn.siteId, search.getSiteId()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<MdCbYarnDto.Item> query = baseSelColumnQuery();
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MdCbYarnDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres).orderBy(orders).offset(offset).limit(pageSize).fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mdCbYarn.count()).where(wheres).fetchOne();

        BasePage<MdCbYarnDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("brandNm", mdCbYarn.brandNm),
            QdslUtil.FieldDef.like("yarnId", mdCbYarn.yarnId),
            QdslUtil.FieldDef.like("yarnNm", mdCbYarn.yarnNm)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("yarnId", mdCbYarn.yarnId,
                   "yarnNm", mdCbYarn.yarnNm,
                   "regDate", mdCbYarn.regDate),
        new OrderSpecifier<>(Order.ASC, mdCbYarn.regDate),
        new OrderSpecifier<>(Order.ASC, mdCbYarn.yarnId));
    }

    @Override
    public int updateSelective(MdCbYarn entity) {
        if (entity.getYarnId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mdCbYarn);
        boolean hasAny = false;

        if (entity.getYarnNm()   != null) { update.set(mdCbYarn.yarnNm,   entity.getYarnNm());   hasAny = true; }
        if (entity.getColorHex() != null) { update.set(mdCbYarn.colorHex, entity.getColorHex()); hasAny = true; }
        if (entity.getWeightCd() != null) { update.set(mdCbYarn.weightCd, entity.getWeightCd()); hasAny = true; }
        if (entity.getBrandNm()  != null) { update.set(mdCbYarn.brandNm,  entity.getBrandNm());  hasAny = true; }
        if (entity.getUseYn()    != null) { update.set(mdCbYarn.useYn,    entity.getUseYn());    hasAny = true; }
        if (entity.getUpdBy()    != null) { update.set(mdCbYarn.updBy,    entity.getUpdBy());    hasAny = true; }
        update.set(mdCbYarn.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;
        long affected = update.where(mdCbYarn.yarnId.eq(entity.getYarnId())).execute();
        return (int) affected;
    }
}
