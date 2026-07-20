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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberSnsRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyCode;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbMemberSnsRepositoryImpl implements QMbMemberSnsRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberSnsRepositoryImpl";
    private static final QMbMemberSns mbMemberSns    = QMbMemberSns.mbMemberSns;
    private static final QMbMember    mbMember  = QMbMember.mbMember;
    private static final QSyCode      cdSc = new QSyCode("cd_sc");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", mbMemberSns.regDate,
        "upd_date", mbMemberSns.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("memberId", mbMemberSns.memberId),
        Map.entry("memberSnsId", mbMemberSns.memberSnsId),
        Map.entry("siteId", mbMemberSns.siteId),
        Map.entry("snsChannelCd", mbMemberSns.snsChannelCd),
        Map.entry("snsUserId", mbMemberSns.snsUserId)
    );

    /* SNS 연동 회원 baseSelColumnQuery */
    private JPAQuery<MbMemberSnsDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberSnsDto.Item.class,
                        mbMemberSns.memberSnsId, mbMemberSns.memberId, mbMemberSns.snsChannelCd, mbMemberSns.snsUserId,
                        mbMemberSns.regBy, mbMemberSns.regDate
                ))
                .from(mbMemberSns)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbMemberSns.memberId))
                .leftJoin(cdSc).on(cdSc.codeGrp.eq("SNS_CHANNEL").and(cdSc.codeValue.eq(mbMemberSns.snsChannelCd)));
    }

    /* SNS 연동 회원 키조회 */
    @Override
    public Optional<MbMemberSnsDto.Item> selectById(String memberSnsId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbMemberSns.memberSnsId.eq(memberSnsId)).fetchOne());
    }

    /* SNS 연동 회원 목록조회 */
    @Override
    public List<MbMemberSnsDto.Item> selectList(MbMemberSnsDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberSnsDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strIn(mbMemberSns.memberId, search.getMemberIds()),
                    QdslUtil.strEq(mbMemberSns.memberId, search.getMemberId()),
                    QdslUtil.strEq(mbMemberSns.memberSnsId, search.getMemberSnsId()),
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

    /* SNS 연동 회원 페이지조회 */
    @Override
    public MbMemberSnsDto.PageResponse selectPageData(MbMemberSnsDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strIn(mbMemberSns.memberId, search.getMemberIds()),
                QdslUtil.strEq(mbMemberSns.memberId, search.getMemberId()),
                QdslUtil.strEq(mbMemberSns.memberSnsId, search.getMemberSnsId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbMemberSnsDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbMemberSnsDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberSns.count())
                .where(wheres)
                .fetchOne();

        MbMemberSnsDto.PageResponse res = new MbMemberSnsDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* SNS 연동 회원 buildCondition */
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

private BooleanExpression andSearchValueLike(MbMemberSnsDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(MbMemberSnsDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, mbMemberSns.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberSns.memberSnsId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberSnsId".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberSns.memberSnsId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberSns.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbMemberSns.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberSns.memberSnsId));
        }
        return orders;
    }

    /* SNS 연동 회원 수정 */

    @Override
    public int updateSelective(MbMemberSns entity) {
        if (entity.getMemberSnsId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberSns);
        boolean hasAny = false;
        if (entity.getMemberId()     != null) { update.set(mbMemberSns.memberId,     entity.getMemberId());     hasAny = true; }
        if (entity.getSnsChannelCd() != null) { update.set(mbMemberSns.snsChannelCd, entity.getSnsChannelCd()); hasAny = true; }
        if (entity.getSnsUserId()    != null) { update.set(mbMemberSns.snsUserId,    entity.getSnsUserId());    hasAny = true; }
        if (!hasAny) return 0;
        return (int) update.where(mbMemberSns.memberSnsId.eq(entity.getMemberSnsId())).execute();
    }
}
