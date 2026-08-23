package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberGradeRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;

import com.shopjoy.ecadminapi.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbMemberGradeRepositoryImpl implements QMbMemberGradeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberGradeRepositoryImpl";
    private static final QSySite siteEx = new QSySite("site_ex");
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QMbMemberGrade mbMemberGrade    = QMbMemberGrade.mbMemberGrade;
    private static final QSySite        sySite  = QSySite.sySite;
    private static final QVwSyCode        codeGradeCd = new QVwSyCode("cd_mg");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * GRADE_CD (코드: MEMBER_GRADE)  {BASIC: '일반', NORMAL: '일반', GOLD: '우수', VIP: 'VIP'}
     * USE_YN                        {Y: '사용', N: '미사용'}
     */
    private JPAQuery<MbMemberGradeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberGradeDto.Item.class,
                        mbMemberGrade.memberGradeId,   // 등급ID (PK)
                        mbMemberGrade.gradeCd,         // 등급코드 — MEMBER_GRADE {BASIC: '일반', GOLD: '우수', VIP: 'VIP'}
                        codeGradeCd.codeLabel.as("gradeCdNm"), // 코드 라벨
                        mbMemberGrade.gradeNm,         // 등급명
                        mbMemberGrade.gradeRank,       // 등급우선순위 (낮을수록 낮은 등급)
                        mbMemberGrade.minPurchaseAmt,  // 등급 유지 최소 누적구매금액
                        mbMemberGrade.saveRate,        // 적립률 (%)
                        mbMemberGrade.useYn,           // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        mbMemberGrade.regBy,           // 등록자ID
                        mbMemberGrade.regDate,         // 등록일시
                        mbMemberGrade.updBy,           // 수정자ID
                        mbMemberGrade.updDate,          // 수정일시
                        mbMemberGrade.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm"),   // 등록자명 (조인)
                        mbMemberGrade.siteId,  // 사이트ID
                        siteEx.siteNm.as("siteNm")   // 사이트명 (조인)
                ))
                .from(mbMemberGrade)
                .innerJoin(codeGradeCd).on(codeGradeCd.codeGrp.eq("MEMBER_GRADE").and(codeGradeCd.codeValue.eq(mbMemberGrade.gradeCd))) // 회원등급
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(mbMemberGrade.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(mbMemberGrade.regBy)) // 등록자
                .leftJoin(siteEx).on(siteEx.siteId.eq(mbMemberGrade.siteId)) // 사이트

                ;
    }

    /* 회원 등급 키조회 */
    @Override
    public Optional<MbMemberGradeDto.Item> selectById(String memberGradeId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbMemberGrade.memberGradeId.eq(memberGradeId)).fetchOne());
    }

    /* 회원 등급 목록조회 */
    @Override
    public List<MbMemberGradeDto.Item> selectList(MbMemberGradeDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mbMemberGrade.memberGradeId, search.getMemberGradeId())); // 등급ID 필터
        whereList.add(QdslUtil.strEq(mbMemberGrade.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberGrade.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberGrade.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mbMemberGrade.siteId, search.getSiteId())); // 사이트ID 필터

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<MbMemberGradeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        List<MbMemberGradeDto.Item> list = query.fetch();
        return list;
    }

    /* 회원 등급 페이지조회 */
    @Override
    public BasePage<MbMemberGradeDto.Item> selectPageData(MbMemberGradeDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(mbMemberGrade.memberGradeId, search.getMemberGradeId())); // 등급ID 필터
        whereList.add(QdslUtil.strEq(mbMemberGrade.useYn, search.getUseYn())); // 사용여부 필터 Y/N
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberGrade.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(mbMemberGrade.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        whereList.add(QdslUtil.strEq(mbMemberGrade.siteId, search.getSiteId())); // 사이트ID 필터
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<MbMemberGradeDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<MbMemberGradeDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberGrade.count())
                .where(wheres)
                .fetchOne();

        BasePage<MbMemberGradeDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 예: "gradeCd,gradeNm,memberGradeId,useYn" (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("gradeCd", mbMemberGrade.gradeCd), // 등급코드 — MEMBER_GRADE
            QdslUtil.FieldDef.like("gradeNm", mbMemberGrade.gradeNm), // 등급명
            QdslUtil.FieldDef.like("memberGradeId", mbMemberGrade.memberGradeId), // 등급ID 필터
            QdslUtil.FieldDef.like("useYn", mbMemberGrade.useYn) // 사용여부 필터 Y/N
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("memberGradeId", mbMemberGrade.memberGradeId,
                   "gradeNm", mbMemberGrade.gradeNm,
                   "regDate", mbMemberGrade.regDate),
        new OrderSpecifier<>(Order.DESC, mbMemberGrade.regDate),
        new OrderSpecifier<>(Order.ASC, mbMemberGrade.memberGradeId));
    }

    /* 회원 등급 수정 */
    @Override
    public int updateSelective(MbMemberGrade entity) {
        if (entity.getMemberGradeId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberGrade);
        boolean hasAny = false;
        if (entity.getGradeCd()        != null) { update.set(mbMemberGrade.gradeCd,        entity.getGradeCd());        hasAny = true; }
        if (entity.getGradeNm()        != null) { update.set(mbMemberGrade.gradeNm,        entity.getGradeNm());        hasAny = true; }
        if (entity.getGradeRank()      != null) { update.set(mbMemberGrade.gradeRank,      entity.getGradeRank());      hasAny = true; }
        if (entity.getMinPurchaseAmt() != null) { update.set(mbMemberGrade.minPurchaseAmt, entity.getMinPurchaseAmt()); hasAny = true; }
        if (entity.getSaveRate()       != null) { update.set(mbMemberGrade.saveRate,       entity.getSaveRate());       hasAny = true; }
        if (entity.getUseYn()          != null) { update.set(mbMemberGrade.useYn,          entity.getUseYn());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(mbMemberGrade.updBy,          entity.getUpdBy());          hasAny = true; }
        update.set(mbMemberGrade.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbMemberGrade.memberGradeId.eq(entity.getMemberGradeId())).execute();
    }
}
