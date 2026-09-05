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
import com.querydsl.core.types.ExpressionUtils;
import com.querydsl.jpa.JPAExpressions;
import com.shopjoy.ecBeBo.md.cb.data.dto.MdCbPatternDto;
import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbPattern;
import com.shopjoy.ecBeBo.md.cb.data.entity.QMdCbPattern;
import com.shopjoy.ecBeBo.md.cb.data.entity.QMdCbPatternCell;
import com.shopjoy.ecBeBo.md.cb.repository.qrydsl.QMdCbPatternRepository;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.QMbMember;
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

/** MdCbPattern(코바늘 도안) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMdCbPatternRepositoryImpl implements QMdCbPatternRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "md.cb.repository.qrydsl.impl.QMdCbPatternRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QMdCbPattern mdCbPattern = QMdCbPattern.mdCbPattern;
    private static final QMbMember memberEx = QMbMember.mbMember;
    private static final QVwSyCode codeStatusCd = new QVwSyCode("cd_ps");
    private static final QMdCbPatternCell patternCellEx = new QMdCbPatternCell("pattern_cell_ex");

    private JPAQuery<MdCbPatternDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MdCbPatternDto.Item.class,
                        mdCbPattern.patternId,          // 도안ID (PK)
                        mdCbPattern.memberId,           // 작성 회원ID
                        mdCbPattern.patternNm,          // 도안명
                        mdCbPattern.patternDesc,        // 도안 설명
                        mdCbPattern.rowCount,           // 총 단수
                        mdCbPattern.maxStitchCount,     // 최대 코수
                        mdCbPattern.descText,           // 한글 도안 설명
                        mdCbPattern.roundDescText,      // 원형(라운드) 도안 입력 텍스트
                        ExpressionUtils.as(              // 격자 셀에 쓰인 서로 다른 배색 수 — 목록에서 기호/배색 도안 구분용
                            JPAExpressions.select(patternCellEx.colorHex.countDistinct())
                                .from(patternCellEx)
                                .where(patternCellEx.patternId.eq(mdCbPattern.patternId).and(patternCellEx.colorHex.isNotNull())),
                            "distinctColorCount"),
                        mdCbPattern.thumbnailUrl,       // 썸네일
                        mdCbPattern.patternStatusCd,    // 상태
                        codeStatusCd.codeLabel.as("patternStatusCdNm"),  // 상태 코드라벨 (조인)
                        mdCbPattern.useYn,              // 사용여부
                        memberEx.memberNm.as("memberNm"),  // 작성 회원명 (조인)
                        mdCbPattern.regBy, mdCbPattern.regDate, mdCbPattern.updBy, mdCbPattern.updDate,
                        mdCbPattern.regSiteId,
                        regSiteEx.siteNm.as("regSiteNm"),
                        regUserEx.userNm.as("regUserNm"),
                        mdCbPattern.siteId,
                        siteEx.siteNm.as("siteNm")
                ))
                .from(mdCbPattern)
                .leftJoin(codeStatusCd).on(codeStatusCd.codeGrp.eq("CB_PATTERN_STATUS_CD").and(codeStatusCd.codeValue.eq(mdCbPattern.patternStatusCd)))
                .leftJoin(memberEx).on(memberEx.memberId.eq(mdCbPattern.memberId))
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(mdCbPattern.regSiteId))
                .leftJoin(regUserEx).on(regUserEx.userId.eq(mdCbPattern.regBy))
                .leftJoin(siteEx).on(siteEx.siteId.eq(mdCbPattern.siteId))
                ;
    }

    @Override
    public Optional<MdCbPatternDto.Item> selectById(String patternId) {
        MdCbPatternDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mdCbPattern.patternId.eq(patternId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    @Override
    public List<MdCbPatternDto.Item> selectList(MdCbPatternDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mdCbPattern.patternId, search.getPatternId()));
        whereList.add(QdslUtil.strEq(mdCbPattern.memberId, search.getMemberId()));
        whereList.add(QdslUtil.strEq(mdCbPattern.patternStatusCd, search.getPatternStatusCd()));
        whereList.add(QdslUtil.strEq(mdCbPattern.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbPattern.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbPattern.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mdCbPattern.siteId, search.getSiteId()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MdCbPatternDto.Item> query = baseSelColumnQuery()
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
    public BasePage<MdCbPatternDto.Item> selectPageData(MdCbPatternDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mdCbPattern.patternId, search.getPatternId()));
        whereList.add(QdslUtil.strEq(mdCbPattern.memberId, search.getMemberId()));
        whereList.add(QdslUtil.strEq(mdCbPattern.patternStatusCd, search.getPatternStatusCd()));
        whereList.add(QdslUtil.strEq(mdCbPattern.useYn, search.getUseYn()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbPattern.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mdCbPattern.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mdCbPattern.siteId, search.getSiteId()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<MdCbPatternDto.Item> query = baseSelColumnQuery();
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MdCbPatternDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres).orderBy(orders).offset(offset).limit(pageSize).fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mdCbPattern.count()).where(wheres).fetchOne();

        BasePage<MdCbPatternDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("patternDesc", mdCbPattern.patternDesc),
            QdslUtil.FieldDef.like("patternId", mdCbPattern.patternId),
            QdslUtil.FieldDef.like("patternNm", mdCbPattern.patternNm),
            QdslUtil.FieldDef.like("memberNm", memberEx.memberNm),     // 작성 회원명 (조인)
            QdslUtil.FieldDef.like("regUserNm", regUserEx.userNm)      // 등록자명 (조인, 관리자 대리등록 케이스)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("patternId", mdCbPattern.patternId,
                   "patternNm", mdCbPattern.patternNm,
                   "regDate", mdCbPattern.regDate),
        new OrderSpecifier<>(Order.DESC, mdCbPattern.regDate),
        new OrderSpecifier<>(Order.ASC, mdCbPattern.patternId));
    }

    @Override
    public int updateSelective(MdCbPattern entity) {
        if (entity.getPatternId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mdCbPattern);
        boolean hasAny = false;

        if (entity.getPatternNm()       != null) { update.set(mdCbPattern.patternNm,       entity.getPatternNm());       hasAny = true; }
        if (entity.getPatternDesc()     != null) { update.set(mdCbPattern.patternDesc,     entity.getPatternDesc());     hasAny = true; }
        if (entity.getRowCount()        != null) { update.set(mdCbPattern.rowCount,        entity.getRowCount());        hasAny = true; }
        if (entity.getMaxStitchCount()  != null) { update.set(mdCbPattern.maxStitchCount,  entity.getMaxStitchCount());  hasAny = true; }
        if (entity.getDescText()        != null) { update.set(mdCbPattern.descText,        entity.getDescText());        hasAny = true; }
        if (entity.getRoundDescText()   != null) { update.set(mdCbPattern.roundDescText,   entity.getRoundDescText());   hasAny = true; }
        if (entity.getThumbnailUrl()    != null) { update.set(mdCbPattern.thumbnailUrl,    entity.getThumbnailUrl());    hasAny = true; }
        if (entity.getPatternStatusCd() != null) { update.set(mdCbPattern.patternStatusCd, entity.getPatternStatusCd()); hasAny = true; }
        if (entity.getUseYn()           != null) { update.set(mdCbPattern.useYn,           entity.getUseYn());           hasAny = true; }
        if (entity.getUpdBy()           != null) { update.set(mdCbPattern.updBy,           entity.getUpdBy());           hasAny = true; }
        update.set(mdCbPattern.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;
        long affected = update.where(mdCbPattern.patternId.eq(entity.getPatternId())).execute();
        return (int) affected;
    }
}
