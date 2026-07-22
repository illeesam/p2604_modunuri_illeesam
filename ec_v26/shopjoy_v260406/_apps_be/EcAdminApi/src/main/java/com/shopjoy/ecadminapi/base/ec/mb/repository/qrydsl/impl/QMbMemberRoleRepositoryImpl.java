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
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberRoleDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.QMbMemberRole;
import com.shopjoy.ecadminapi.base.ec.mb.repository.qrydsl.QMbMemberRoleRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyRole;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUser;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;
@RequiredArgsConstructor
public class QMbMemberRoleRepositoryImpl implements QMbMemberRoleRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.mb.repository.qrydsl.impl.QMbMemberRoleRepositoryImpl";
    private static final QMbMemberRole mbMemberRole   = QMbMemberRole.mbMemberRole;
    private static final QMbMember     mbMember = QMbMember.mbMember;
    private static final QSyRole       syRole = QSyRole.syRole;
    private static final QSyUser       gu  = new QSyUser("gu");
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", mbMemberRole.regDate,
        "upd_date", mbMemberRole.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("grantUserId", mbMemberRole.grantUserId),
        Map.entry("memberId", mbMemberRole.memberId),
        Map.entry("memberRoleId", mbMemberRole.memberRoleId),
        Map.entry("memberRoleRemark", mbMemberRole.memberRoleRemark),
        Map.entry("roleId", mbMemberRole.roleId),
        Map.entry("siteId", mbMemberRole.siteId)
    );

    /* 회원 역할 연결 baseSelColumnQuery — 코드성 필드 없음 (역할/일자 위주) */
    private JPAQuery<MbMemberRoleDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(MbMemberRoleDto.Item.class,
                        mbMemberRole.memberRoleId,      // PK
                        mbMemberRole.memberId,          // 회원 ID (mb_member.member_id)
                        mbMemberRole.roleId,            // 역할 ID (sy_role.role_id)
                        mbMemberRole.grantUserId,       // 권한 부여 관리자 ID
                        mbMemberRole.grantDate,         // 권한 부여 일시
                        mbMemberRole.validFrom,         // 유효 시작일
                        mbMemberRole.validTo,           // 유효 종료일
                        mbMemberRole.memberRoleRemark,  // 비고
                        mbMemberRole.regBy,             // 등록자
                        mbMemberRole.regDate,           // 등록일
                        mbMemberRole.updBy,             // 수정자
                        mbMemberRole.updDate,           // 수정일
                        mbMember.memberNm.as("memberNm"),     // 회원명 (mb_member 조인)
                        syRole.roleNm.as("roleNm"),           // 역할명 (sy_role 조인)
                        gu.userNm.as("grantUserNm")           // 권한 부여 관리자명 (sy_user 조인, 별칭 gu)
                ))
                .from(mbMemberRole)
                .leftJoin(mbMember).on(mbMember.memberId.eq(mbMemberRole.memberId))
                .leftJoin(syRole).on(syRole.roleId.eq(mbMemberRole.roleId))
                .leftJoin(gu).on(gu.userId.eq(mbMemberRole.grantUserId));
    }

    /* 회원 역할 연결 키조회 */
    @Override
    public Optional<MbMemberRoleDto.Item> selectById(String memberRoleId) {
        return Optional.ofNullable(baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(mbMemberRole.memberRoleId.eq(memberRoleId)).fetchOne());
    }

    /* 회원 역할 연결 목록조회 */
    @Override
    public List<MbMemberRoleDto.Item> selectList(MbMemberRoleDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<MbMemberRoleDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                    QdslUtil.strEq(mbMemberRole.memberRoleId, search.getMemberRoleId()),
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

    /* 회원 역할 연결 페이지조회 */
    @Override
    public MbMemberRoleDto.PageResponse selectPageData(MbMemberRoleDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(mbMemberRole.memberRoleId, search.getMemberRoleId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValueLike(search)
        };

        // 공용 base: 조인까지만 정의 (list/count 가 동일한 from·join 공유)
        JPAQuery<MbMemberRoleDto.Item> query = baseSelColumnQuery();

        // list: base 복제 + where + 정렬 + 페이징
        List<MbMemberRoleDto.Item> content = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset(offset).limit(limit)
                .fetch();

        // count: base 복제 + select 를 count 로 교체 + 동일 where
        Long total = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(mbMemberRole.count())
                .where(wheres)
                .fetchOne();

        MbMemberRoleDto.PageResponse res = new MbMemberRoleDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }
    /* ============================================================
     * 검색조건 — 개별 andXxx() BooleanExpression 반환 메서드 모음
     * .where(andXxxEq(search), andYyyIn(search), ...) 형태로 직접 나열 사용
     * null 반환은 .where(Predicate...) vararg 가 자동 무시
     * ============================================================ */

    private BooleanExpression andSearchValueLike(MbMemberRoleDto.Request search) {
        return search == null ? null : QdslUtil.searchValueLike(search.getSearchValue(), search.getSearchType(), SEARCH_FIELDS);
    }


    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(MbMemberRoleDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, mbMemberRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberRole.memberRoleId));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("memberRoleId".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberRole.memberRoleId));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, mbMemberRole.regDate));
                }
            }
        }
        /* 기본 정렬 — sort 지정 없을 때 regDate DESC fallback */
        /* unknown sort fallback: 안정 정렬 보장 (PK 동률 키) */
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, mbMemberRole.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, mbMemberRole.memberRoleId));
        }
        return orders;
    }

    /* 회원 역할 연결 수정 */

    @Override
    public int updateSelective(MbMemberRole entity) {
        if (entity.getMemberRoleId() == null) return 0;
        JPAUpdateClause update = queryFactory.update(mbMemberRole);
        boolean hasAny = false;
        if (entity.getMemberId()         != null) { update.set(mbMemberRole.memberId,         entity.getMemberId());         hasAny = true; }
        if (entity.getRoleId()           != null) { update.set(mbMemberRole.roleId,           entity.getRoleId());           hasAny = true; }
        if (entity.getGrantUserId()      != null) { update.set(mbMemberRole.grantUserId,      entity.getGrantUserId());      hasAny = true; }
        if (entity.getGrantDate()        != null) { update.set(mbMemberRole.grantDate,        entity.getGrantDate());        hasAny = true; }
        if (entity.getValidFrom()        != null) { update.set(mbMemberRole.validFrom,        entity.getValidFrom());        hasAny = true; }
        if (entity.getValidTo()          != null) { update.set(mbMemberRole.validTo,          entity.getValidTo());          hasAny = true; }
        if (entity.getMemberRoleRemark() != null) { update.set(mbMemberRole.memberRoleRemark, entity.getMemberRoleRemark()); hasAny = true; }
        if (entity.getUpdBy()            != null) { update.set(mbMemberRole.updBy,            entity.getUpdBy());            hasAny = true; }
        /* updDate 는 entity 값 무시하고 DB CURRENT_TIMESTAMP 강제 적용 */
        update.set(mbMemberRole.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));
        if (!hasAny) return 0;
        return (int) update.where(mbMemberRole.memberRoleId.eq(entity.getMemberRoleId())).execute();
    }
}
