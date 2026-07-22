package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.impl;

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
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.QPmCache;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCacheRepository;
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
/** PmCache QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QPmCacheRepositoryImpl implements QPmCacheRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.pm.repository.qrydsl.impl.QPmCacheRepositoryImpl";
    private static final QPmCache pmCache    = QPmCache.pmCache;
    private static final QSySite  sySite  = QSySite.sySite;
    private static final QSyCode  cdCt = new QSyCode("cd_ct");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", pmCache.regDate,
        "upd_date", pmCache.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("cacheDesc", pmCache.cacheDesc),
        Map.entry("cacheId", pmCache.cacheId),
        Map.entry("cacheTypeCd", pmCache.cacheTypeCd),
        Map.entry("memberId", pmCache.memberId),
        Map.entry("memberNm", pmCache.memberNm),
        Map.entry("procUserId", pmCache.procUserId),
        Map.entry("refId", pmCache.refId),
        Map.entry("siteId", pmCache.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * CACHE_TYPE  {EARN_BUY: '구매 적립', EARN_ADMIN: '관리자 지급', EARN_EVENT: '이벤트 지급', USE_ORDER: '주문 사용', REFUND: '환불 복원', EXPIRE: '소멸'}
     * (참고: sy_code 샘플 데이터 기준. 운영 DB의 실제 등록값과 다를 수 있음 — Entity/DDL 주석에는 코드값이 명시되어 있지 않음)
     */
    private JPAQuery<PmCacheDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(PmCacheDto.Item.class,
                        pmCache.cacheId,       // 적립금(캐시)ID (PK, YYMMDDhhmmss+rand4)
                        pmCache.siteId,        // 사이트ID (sy_site.site_id)
                        pmCache.memberId,      // 회원ID (mb_member.member_id)
                        pmCache.memberNm,      // 회원명 (스냅샷)
                        pmCache.cacheTypeCd,   // 유형 — CACHE_TYPE {EARN_BUY, EARN_ADMIN, EARN_EVENT, USE_ORDER, REFUND, EXPIRE}
                        pmCache.cacheAmt,      // 변동 금액 (양수:적립 / 음수:차감)
                        pmCache.balanceAmt,    // 처리 후 잔액
                        pmCache.refId,         // 참조ID (주문ID 등)
                        pmCache.cacheDesc,     // 내역 설명
                        pmCache.procUserId,    // 처리자 (관리자 직접 부여 시)
                        pmCache.cacheDate,     // 처리일시
                        pmCache.expireDate,    // 소멸예정일
                        pmCache.regBy, pmCache.regDate, pmCache.updBy, pmCache.updDate
                ))
                .from(pmCache)
                .leftJoin(sySite).on(sySite.siteId.eq(pmCache.siteId))
                .leftJoin(cdCt).on(cdCt.codeGrp.eq("CACHE_TYPE").and(cdCt.codeValue.eq(pmCache.cacheTypeCd)));
    }

    /* 캐시(충전금) 키조회 */
    @Override
    public Optional<PmCacheDto.Item> selectById(String cacheId) {
        PmCacheDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()").where(pmCache.cacheId.eq(cacheId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /* 캐시(충전금) 목록조회 */
    @Override
    public List<PmCacheDto.Item> selectList(PmCacheDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<PmCacheDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(pmCache.siteId, search.getSiteId()),
                    QdslUtil.strEq(pmCache.cacheId, search.getCacheId()),
                    QdslUtil.strEq(pmCache.cacheTypeCd, search.getCacheTypeCd()),
                    QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                    andSearchValueLike(search)
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

    /* 캐시(충전금) 페이지조회 */
    @Override
    public PmCacheDto.PageResponse selectPageData(PmCacheDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(pmCache.siteId, search.getSiteId()),
                QdslUtil.strEq(pmCache.cacheId, search.getCacheId()),
                QdslUtil.strEq(pmCache.cacheTypeCd, search.getCacheTypeCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<PmCacheDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<PmCacheDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(pmCache.count())
                .where(wheres)
                .fetchOne();

        PmCacheDto.PageResponse res = new PmCacheDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* searchType 사용 예  searchType = "blogTitle,blogAuthor" */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(PmCacheDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(PmCacheDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, pmCache.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmCache.cacheId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("cacheId".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmCache.cacheId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmCache.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, pmCache.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, pmCache.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, pmCache.cacheId));
        }
        return orders;
    }

    /* 캐시(충전금) 수정 */

    @Override
    public int updateSelective(PmCache entity) {
        if (entity.getCacheId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(pmCache);
        boolean hasAny = false;

        if (entity.getSiteId()      != null) { update.set(pmCache.siteId,      entity.getSiteId());      hasAny = true; }
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
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(pmCache.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(pmCache.cacheId.eq(entity.getCacheId())).execute();
        return (int) affected;
    }
}
