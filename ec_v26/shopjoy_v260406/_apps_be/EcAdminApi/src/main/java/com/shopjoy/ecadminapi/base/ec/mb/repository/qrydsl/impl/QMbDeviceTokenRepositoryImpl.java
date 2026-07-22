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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbDeviceTokenDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbDeviceToken;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbDeviceTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbDeviceTokenRepositoryImpl implements QMbDeviceTokenRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbDeviceTokenRepositoryImpl";
    private static final QMbDeviceToken mbDeviceToken   = QMbDeviceToken.mbDeviceToken;
    private static final QMbMember      mbMember = QMbMember.mbMember;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", mbDeviceToken.regDate,
        "upd_date", mbDeviceToken.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("benefitNotiYn", mbDeviceToken.benefitNotiYn),
        Map.entry("deviceToken", mbDeviceToken.deviceToken),
        Map.entry("deviceTokenId", mbDeviceToken.deviceTokenId),
        Map.entry("memberId", mbDeviceToken.memberId),
        Map.entry("osType", mbDeviceToken.osType),
        Map.entry("siteId", mbDeviceToken.siteId)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * OS_TYPE          ANDROID/IOS (코드 미등록, DDL 코멘트 기준 값)
     * BENEFIT_NOTI_YN  {Y: '수신', N: '미수신'}
     */
    private JPAQuery<MbDeviceTokenDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbDeviceTokenDto.Item.class,
                        mbDeviceToken.deviceTokenId,   // 디바이스 토큰ID (PK)
                        mbDeviceToken.deviceToken,     // 디바이스 토큰 키
                        mbDeviceToken.siteId,          // 사이트ID (sy_site.site_id)
                        mbDeviceToken.memberId,        // 회원ID (mb_member.member_id, 비회원 가능)
                        mbDeviceToken.osType,          // OS유형 — ANDROID/IOS
                        mbDeviceToken.benefitNotiYn,   // 혜택알림수신여부 — BENEFIT_NOTI_YN {Y: '수신', N: '미수신'}
                        mbDeviceToken.alimReadDate,    // 알림리스트 읽음일시
                        mbDeviceToken.regBy,           // 등록자
                        mbDeviceToken.regDate,         // 등록일시
                        mbDeviceToken.updBy,           // 수정자
                        mbDeviceToken.updDate,         // 수정일시
                        mbMember.memberNm.as("memberNm")   // 회원명 (mb_member 조인)
                ))
                .from(mbDeviceToken)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbDeviceToken.memberId));
    }

    /* 키조회 */
    @Override
    public Optional<MbDeviceTokenDto.Item> selectById(String deviceTokenId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbDeviceToken.deviceTokenId.eq(deviceTokenId)).fetchOne());
    }

    /* 목록조회 */
    @Override
    public List<MbDeviceTokenDto.Item> selectList(MbDeviceTokenDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbDeviceTokenDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(mbDeviceToken.siteId, search.getSiteId()),
                    QdslUtil.strEq(mbDeviceToken.deviceTokenId, search.getDeviceTokenId()),
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

    /* 페이지조회 */
    @Override
    public MbDeviceTokenDto.PageResponse selectPageData(MbDeviceTokenDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(mbDeviceToken.siteId, search.getSiteId()),
                QdslUtil.strEq(mbDeviceToken.deviceTokenId, search.getDeviceTokenId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbDeviceTokenDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbDeviceTokenDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbDeviceToken.count())
                .where(wheres)
                .fetchOne();

        MbDeviceTokenDto.PageResponse res = new MbDeviceTokenDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(MbDeviceTokenDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(MbDeviceTokenDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, mbDeviceToken.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbDeviceToken.deviceTokenId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("deviceTokenId".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbDeviceToken.deviceTokenId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbDeviceToken.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbDeviceToken.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbDeviceToken.deviceTokenId));
        }
        return orders;
    }

    /* 수정 */

    @Override
    public int updateSelective(MbDeviceToken entity) {
        if (entity.getDeviceTokenId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbDeviceToken);
        boolean hasAny = false;
        if (entity.getDeviceToken()   != null) { update.set(mbDeviceToken.deviceToken,   entity.getDeviceToken());   hasAny = true; }
        if (entity.getMemberId()      != null) { update.set(mbDeviceToken.memberId,      entity.getMemberId());      hasAny = true; }
        if (entity.getOsType()        != null) { update.set(mbDeviceToken.osType,        entity.getOsType());        hasAny = true; }
        if (entity.getBenefitNotiYn() != null) { update.set(mbDeviceToken.benefitNotiYn, entity.getBenefitNotiYn()); hasAny = true; }
        if (entity.getAlimReadDate()  != null) { update.set(mbDeviceToken.alimReadDate,  entity.getAlimReadDate());  hasAny = true; }
        if (entity.getUpdBy()         != null) { update.set(mbDeviceToken.updBy,         entity.getUpdBy());         hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbDeviceToken.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbDeviceToken.deviceTokenId.eq(entity.getDeviceTokenId())).execute();
    }
}
