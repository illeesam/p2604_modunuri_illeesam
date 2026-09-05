package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.impl;

import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecBeBo.base.ec.pm.data.entity.QPmCache;
import com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl.QPmCacheRepository;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSyUser;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;

import com.shopjoy.ecBeBo.base.sy.data.entity.QVwSyCode;
import com.shopjoy.ecBeBo.base.sy.data.entity.QSySite;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecBeBo.common.util.QdslUtil;
/** PmCache(적립금 (캐시)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCacheRepositoryImpl implements QPmCacheRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCacheRepositoryImpl";
    private static final QSyUser regUserEx = new QSyUser("reg_user_ex");
    private static final QSySite regSiteEx = new QSySite("reg_site_ex");
    private static final QPmCache pmCache    = QPmCache.pmCache;
    private static final QSySite  sySite  = QSySite.sySite;
    private static final QVwSyCode  codeCacheTypeCd = new QVwSyCode("cd_ct");    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CACHE_TYPE  {EARN_BUY: '구매 적립', EARN_ADMIN: '관리자 지급', EARN_EVENT: '이벤트 지급', USE_ORDER: '주문 사용', REFUND: '환불 복원', EXPIRE: '소멸'}
     * (참고: sy_code 샘플 데이터 기준. 운영 DB의 실제 등록값과 다를 수 있음 — Entity/DDL 주석에는 코드값이 명시되어 있지 않음)
     */
    private JPAQuery<PmCacheDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCacheDto.Item.class,
                        pmCache.cacheId,       // 적립금(캐시)ID (PK, YYMMDDhhmmss+rand4)
                        pmCache.memberId,      // 회원ID (mb_member.member_id)
                        pmCache.memberNm,      // 회원명 (스냅샷)
                        pmCache.cacheTypeCd,   // 유형 — CACHE_TYPE {EARN_BUY, EARN_ADMIN, EARN_EVENT, USE_ORDER, REFUND, EXPIRE}
                        codeCacheTypeCd.codeLabel.as("cacheTypeCdNm"), // 코드 라벨
                        pmCache.cacheAmt,      // 변동 금액 (양수:적립 / 음수:차감)
                        pmCache.balanceAmt,    // 처리 후 잔액
                        pmCache.refId,         // 참조ID (주문ID 등)
                        pmCache.cacheDesc,     // 내역 설명
                        pmCache.procUserId,    // 처리자 (관리자 직접 부여 시)
                        pmCache.cacheDate,     // 처리일시
                        pmCache.expireDate,    // 소멸예정일
                        pmCache.regBy,      // 등록자
                        pmCache.regDate,    // 등록일시
                        pmCache.updBy,      // 수정자
                        pmCache.updDate,    // 수정일시
                        pmCache.regSiteId,  // 등록사이트ID
                        regSiteEx.siteNm.as("regSiteNm"),  // 등록사이트명 (조인)
                        regUserEx.userNm.as("regUserNm")   // 등록자명 (조인)
                ))
                .from(pmCache)
                .innerJoin(codeCacheTypeCd).on(codeCacheTypeCd.codeGrp.eq("CACHE_TYPE_CD").and(codeCacheTypeCd.codeValue.eq(pmCache.cacheTypeCd))) // 캐쉬유형
                .leftJoin(regSiteEx).on(regSiteEx.siteId.eq(pmCache.regSiteId)) // 등록사이트
                .leftJoin(regUserEx).on(regUserEx.userId.eq(pmCache.regBy)) // 등록자
                ;
    }

    /* 캐시(충전금) 키조회 */
    @Override
    public Optional<PmCacheDto.Item> selectById(String cacheId) {
        PmCacheDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmCache.cacheId.eq(cacheId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 캐시(충전금) 목록조회 */
    @Override
    public List<PmCacheDto.Item> selectList(PmCacheDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));

        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmCache.cacheId, search.getCacheId())); // 적립금ID 필터
        whereList.add(QdslUtil.strEq(pmCache.cacheTypeCd, search.getCacheTypeCd())); // 유형 — CACHE_TYPE_CD
        whereList.add(QdslUtil.strEq(pmCache.memberId, search.getMemberId())); // 회원ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCache.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCache.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<PmCacheDto.Item> query = baseSelColumnQuery()
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
        List<PmCacheDto.Item> list = query.fetch();
        return list;
    }

    /* 캐시(충전금) 페이지조회 */
    @Override
    public BasePage<PmCacheDto.Item> selectPageData(PmCacheDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(pmCache.cacheId, search.getCacheId())); // 적립금ID 필터
        whereList.add(QdslUtil.strEq(pmCache.cacheTypeCd, search.getCacheTypeCd())); // 유형 — CACHE_TYPE_CD
        whereList.add(QdslUtil.strEq(pmCache.memberId, search.getMemberId())); // 회원ID 필터
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCache.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(pmCache.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<PmCacheDto.Item> query = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<PmCacheDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmCache.count())
                .where(wheres)
                .fetchOne();

        BasePage<PmCacheDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }
    /* searchType 예: "cacheDesc,cacheId,cacheTypeCd,memberId,memberNm" 등 (콤마 조합, 미지정 시 전체 OR) */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("cacheDesc", pmCache.cacheDesc), // 내역 설명
            QdslUtil.FieldDef.like("cacheId", pmCache.cacheId), // 적립금ID 필터
            QdslUtil.FieldDef.like("cacheTypeCd", pmCache.cacheTypeCd), // 유형 — CACHE_TYPE_CD
            QdslUtil.FieldDef.like("memberId", pmCache.memberId), // 회원ID 필터
            QdslUtil.FieldDef.like("memberNm", pmCache.memberNm), // 회원명
            QdslUtil.FieldDef.like("procUserId", pmCache.procUserId), // 처리자 (관리자 직접 부여시)
            QdslUtil.FieldDef.like("refId", pmCache.refId) // 참조ID (주문ID 등)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("cacheId", pmCache.cacheId,
                   "memberNm", pmCache.memberNm,
                   "regDate", pmCache.regDate),
        new OrderSpecifier<>(Order.DESC, pmCache.regDate),
        new OrderSpecifier<>(Order.ASC, pmCache.cacheId));
    }

    /* 캐시(충전금) 수정 */
    @Override
    public int updateSelective(PmCache entity) {
        if (entity.getCacheId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmCache);
        boolean hasAny = false;

        if (entity.getMemberId()    != null) { update.set(pmCache.memberId,    entity.getMemberId());    hasAny = true; }
        if (entity.getMemberNm()    != null) { update.set(pmCache.memberNm,    entity.getMemberNm());    hasAny = true; }
        if (entity.getCacheTypeCd() != null) { update.set(pmCache.cacheTypeCd, entity.getCacheTypeCd()); hasAny = true; }
        if (entity.getCacheAmt()    != null) { update.set(pmCache.cacheAmt,    entity.getCacheAmt());    hasAny = true; }
        if (entity.getBalanceAmt()  != null) { update.set(pmCache.balanceAmt,  entity.getBalanceAmt());  hasAny = true; }
        if (entity.getRefId()       != null) { update.set(pmCache.refId,       entity.getRefId());       hasAny = true; }
        if (entity.getCacheDesc()   != null) { update.set(pmCache.cacheDesc,   entity.getCacheDesc());   hasAny = true; }
        if (entity.getProcUserId()  != null) { update.set(pmCache.procUserId,  entity.getProcUserId());  hasAny = true; }
        if (entity.getCacheDate()   != null) { update.set(pmCache.cacheDate,   entity.getCacheDate());   hasAny = true; }
        if (entity.getExpireDate()  != null) { update.set(pmCache.expireDate,  entity.getExpireDate());  hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(pmCache.updBy,       entity.getUpdBy());       hasAny = true; }
        update.set(pmCache.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmCache.cacheId.eq(entity.getCacheId())).execute();
        return (int) affected;
    }
}
