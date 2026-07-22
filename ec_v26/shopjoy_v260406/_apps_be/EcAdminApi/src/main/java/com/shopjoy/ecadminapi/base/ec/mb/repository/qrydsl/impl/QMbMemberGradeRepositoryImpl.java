package com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGradeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberGrade;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberGradeRepository;
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
@RequiredArgsConstructor
public class QMbMemberGradeRepositoryImpl implements QMbMemberGradeRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberGradeRepositoryImpl";
    private static final QMbMemberGrade mbMemberGrade    = QMbMemberGrade.mbMemberGrade;
    private static final QSySite        sySite  = QSySite.sySite;
    private static final QSyCode        cdMg = new QSyCode("cd_mg");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", mbMemberGrade.regDate,
        "upd_date", mbMemberGrade.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("gradeCd", mbMemberGrade.gradeCd),
        Map.entry("gradeNm", mbMemberGrade.gradeNm),
        Map.entry("memberGradeId", mbMemberGrade.memberGradeId),
        Map.entry("siteId", mbMemberGrade.siteId),
        Map.entry("useYn", mbMemberGrade.useYn)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * GRADE_CD (코드: MEMBER_GRADE)  {BASIC: '일반', NORMAL: '일반', GOLD: '우수', VIP: 'VIP'}
     * USE_YN                        {Y: '사용', N: '미사용'}
     */
    private JPAQuery<MbMemberGradeDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberGradeDto.Item.class,
                        mbMemberGrade.memberGradeId,   // 등급ID (PK)
                        mbMemberGrade.siteId,          // 사이트ID (sy_site.site_id)
                        mbMemberGrade.gradeCd,         // 등급코드 — MEMBER_GRADE {BASIC: '일반', GOLD: '우수', VIP: 'VIP'}
                        mbMemberGrade.gradeNm,         // 등급명
                        mbMemberGrade.gradeRank,       // 등급우선순위 (낮을수록 낮은 등급)
                        mbMemberGrade.minPurchaseAmt,  // 등급 유지 최소 누적구매금액
                        mbMemberGrade.saveRate,        // 적립률 (%)
                        mbMemberGrade.useYn,           // 사용여부 — USE_YN {Y: '사용', N: '미사용'}
                        mbMemberGrade.regBy,           // 등록자ID
                        mbMemberGrade.regDate,         // 등록일시
                        mbMemberGrade.updBy,           // 수정자ID
                        mbMemberGrade.updDate          // 수정일시
                ))
                .from(mbMemberGrade)
                .leftJoin(sySite).on(sySite.siteId.eq(mbMemberGrade.siteId))
                .leftJoin(cdMg).on(cdMg.codeGrp.eq("MEMBER_GRADE").and(cdMg.codeValue.eq(mbMemberGrade.gradeCd)));
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
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberGradeDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(mbMemberGrade.siteId, search.getSiteId()),
                    QdslUtil.strEq(mbMemberGrade.memberGradeId, search.getMemberGradeId()),
                    QdslUtil.strEq(mbMemberGrade.useYn, search.getUseYn()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo(), pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            int limit  = pageSize;
            query.offset(offset).limit(limit);
        }
        return query.fetch();
    }

    /* 회원 등급 페이지조회 */
    @Override
    public MbMemberGradeDto.PageResponse selectPageData(MbMemberGradeDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(mbMemberGrade.siteId, search.getSiteId()),
                QdslUtil.strEq(mbMemberGrade.memberGradeId, search.getMemberGradeId()),
                QdslUtil.strEq(mbMemberGrade.useYn, search.getUseYn()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbMemberGradeDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbMemberGradeDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberGrade.count())
                .where(wheres)
                .fetchOne();

        MbMemberGradeDto.PageResponse res = new MbMemberGradeDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "gradeNm,gradeCd" (Entity 필드명) */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(MbMemberGradeDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(MbMemberGradeDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, mbMemberGrade.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberGrade.memberGradeId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberGradeId".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberGrade.memberGradeId));
                } else if ("gradeNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberGrade.gradeNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberGrade.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbMemberGrade.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberGrade.memberGradeId));
        }
        return orders;
    }

    /* 회원 등급 수정 */

    @Override
    public int updateSelective(MbMemberGrade entity) {
        if (entity.getMemberGradeId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberGrade);
        boolean hasAny = false;
        if (entity.getSiteId()         != null) { update.set(mbMemberGrade.siteId,         entity.getSiteId());         hasAny = true; }
        if (entity.getGradeCd()        != null) { update.set(mbMemberGrade.gradeCd,        entity.getGradeCd());        hasAny = true; }
        if (entity.getGradeNm()        != null) { update.set(mbMemberGrade.gradeNm,        entity.getGradeNm());        hasAny = true; }
        if (entity.getGradeRank()      != null) { update.set(mbMemberGrade.gradeRank,      entity.getGradeRank());      hasAny = true; }
        if (entity.getMinPurchaseAmt() != null) { update.set(mbMemberGrade.minPurchaseAmt, entity.getMinPurchaseAmt()); hasAny = true; }
        if (entity.getSaveRate()       != null) { update.set(mbMemberGrade.saveRate,       entity.getSaveRate());       hasAny = true; }
        if (entity.getUseYn()          != null) { update.set(mbMemberGrade.useYn,          entity.getUseYn());          hasAny = true; }
        if (entity.getUpdBy()          != null) { update.set(mbMemberGrade.updBy,          entity.getUpdBy());          hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbMemberGrade.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbMemberGrade.memberGradeId.eq(entity.getMemberGradeId())).execute();
    }
}
