package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmChattRoom;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/** CmChattRoom QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmChattRoomRepositoryImpl implements QCmChattRoomRepository {

    private final JPAQueryFactory queryFactory;
    private static final QCmChattRoom r = QCmChattRoom.cmChattRoom;

    /** 기본 쿼리 빌드 */
    private JPAQuery<CmChattRoomDto.Item> buildBaseQuery() {
        return queryFactory
                .select(Projections.bean(CmChattRoomDto.Item.class,
                        r.chattRoomId, r.siteId, r.memberId, r.memberNm,
                        r.adminUserId, r.subject, r.chattStatusCd, r.chattStatusCdBefore,
                        r.lastMsgDate, r.memberUnreadCnt, r.adminUnreadCnt,
                        r.chattMemo, r.closeDate, r.closeReason,
                        r.regBy, r.regDate, r.updBy, r.updDate
                ))
                .from(r);
    }

    /** 단건 조회 */
    @Override
    public Optional<CmChattRoomDto.Item> selectById(String chattRoomId) {
        CmChattRoomDto.Item dto = buildBaseQuery()
                .where(r.chattRoomId.eq(chattRoomId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    /** 전체 목록 */
    @Override
    public List<CmChattRoomDto.Item> selectList(CmChattRoomDto.Request search) {
        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmChattRoomDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        Integer pageNo = search == null ? null : search.getPageNo();
        Integer pageSize = search == null ? null : search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            int offset = (pageNo - 1) * pageSize;
            query.offset(offset).limit(pageSize);
        }
        return query.fetch();
    }

    /** 페이지 목록 */
    @Override
    public CmChattRoomDto.PageResponse selectPageList(CmChattRoomDto.Request search) {
        int pageNo = search != null && search.getPageNo() != null && search.getPageNo() > 0 ? search.getPageNo() : 1;
        int pageSize = search != null && search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;
        int offset = (pageNo - 1) * pageSize;

        BooleanBuilder where = buildCondition(search);
        List<OrderSpecifier<?>> orderList = buildOrder(search);

        JPAQuery<CmChattRoomDto.Item> query = buildBaseQuery().where(where);
        if (!orderList.isEmpty()) {
            query = query.orderBy(orderList.toArray(OrderSpecifier[]::new));
        }
        List<CmChattRoomDto.Item> content = query.offset(offset).limit(pageSize).fetch();

        Long total = queryFactory
                .select(r.count())
                .from(r)
                .where(where)
                .fetchOne();

        CmChattRoomDto.PageResponse res = new CmChattRoomDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

    /** 검색조건 빌드 */
    // searchTypes 사용 예 (콤마 경계 매칭):
    //   - 단일 조건  : searchTypes = "def_blog_title"
    //   - 복합 조건  : searchTypes = "def_blog_title,def_blog_author"   (UI 에서 aaa,bbb 형태로 전달)
    //   - 미지정     : searchTypes = null/"" 이면 all=true 로 전체 컬럼 OR 검색
    //
    //   buildCondition 내부에서는
    //     String types = "," + searchTypes + ",";   // 예: ",def_blog_title,def_blog_author,"
    //     types.contains(",def_blog_title,")         // 토큰 경계 정확 매칭 (부분문자열 오매칭 방지)
    //   형태로 비교한다.
    private BooleanBuilder buildCondition(CmChattRoomDto.Request s) {
        BooleanBuilder w = new BooleanBuilder();
        if (s == null) return w;

        if (StringUtils.hasText(s.getSiteId()))      w.and(r.siteId.eq(s.getSiteId()));
        if (StringUtils.hasText(s.getChattRoomId())) w.and(r.chattRoomId.eq(s.getChattRoomId()));

        // searchValue + searchTypes (def_member_nm)
        if (StringUtils.hasText(s.getSearchValue())) {
            String types = "," + (s.getSearchTypes() == null ? "" : s.getSearchTypes().trim()) + ",";
            boolean all = !StringUtils.hasText(s.getSearchTypes());
            String pattern = "%" + s.getSearchValue() + "%";

            BooleanBuilder or = new BooleanBuilder();
            if (all || types.contains(",def_member_nm,")) or.or(r.memberNm.likeIgnoreCase(pattern));
            if (or.getValue() != null) w.and(or);
        }

        // dateType + dateStart + dateEnd
        if (StringUtils.hasText(s.getDateType())
                && StringUtils.hasText(s.getDateStart())
                && StringUtils.hasText(s.getDateEnd())) {
            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd");
            LocalDateTime start = LocalDate.parse(s.getDateStart(), fmt).atStartOfDay();
            LocalDateTime endExcl = LocalDate.parse(s.getDateEnd(), fmt).plusDays(1).atStartOfDay();
            switch (s.getDateType()) {
                case "reg_date":
                    w.and(r.regDate.goe(start)).and(r.regDate.lt(endExcl));
                    break;
                case "upd_date":
                    w.and(r.updDate.goe(start)).and(r.updDate.lt(endExcl));
                    break;
                default:
                    break;
            }
        }
        return w;
    }

    /**
     * 정렬조건 빌드
     * 예: "userId asc, userNm desc, regDate asc"
     */
    @SuppressWarnings({"rawtypes","unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmChattRoomDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, r.regDate));
            return orders;
        }
        String[] sortParts = sort.split(",");
        for (String part : sortParts) {
            String trimmed = part.trim();
            String[] fieldAndDir = trimmed.split(" ");
            if (fieldAndDir.length == 2) {
                String field = fieldAndDir[0];
                Order order = "desc".equalsIgnoreCase(fieldAndDir[1]) ? Order.DESC : Order.ASC;
                if ("chattRoomId".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.chattRoomId));
                } else if ("memberNm".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.memberNm));
                } else if ("regDate".equals(field)) {
                    orders.add(new OrderSpecifier(order, r.regDate));
                }
            }
        }
        return orders;
    }

    /** updateSelective — Mapper XML 과 동일한 컬럼셋만 갱신 */
    @Override
    public int updateSelective(CmChattRoom entity) {
        if (entity.getChattRoomId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(r);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(r.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getMemberId()            != null) { update.set(r.memberId,            entity.getMemberId());            hasAny = true; }
        if (entity.getMemberNm()            != null) { update.set(r.memberNm,            entity.getMemberNm());            hasAny = true; }
        if (entity.getAdminUserId()         != null) { update.set(r.adminUserId,         entity.getAdminUserId());         hasAny = true; }
        if (entity.getSubject()             != null) { update.set(r.subject,             entity.getSubject());             hasAny = true; }
        if (entity.getChattStatusCd()       != null) { update.set(r.chattStatusCd,       entity.getChattStatusCd());       hasAny = true; }
        if (entity.getChattStatusCdBefore() != null) { update.set(r.chattStatusCdBefore, entity.getChattStatusCdBefore()); hasAny = true; }
        if (entity.getLastMsgDate()         != null) { update.set(r.lastMsgDate,         entity.getLastMsgDate());         hasAny = true; }
        if (entity.getMemberUnreadCnt()     != null) { update.set(r.memberUnreadCnt,     entity.getMemberUnreadCnt());     hasAny = true; }
        if (entity.getAdminUnreadCnt()      != null) { update.set(r.adminUnreadCnt,      entity.getAdminUnreadCnt());      hasAny = true; }
        if (entity.getChattMemo()           != null) { update.set(r.chattMemo,           entity.getChattMemo());           hasAny = true; }
        if (entity.getCloseDate()           != null) { update.set(r.closeDate,           entity.getCloseDate());           hasAny = true; }
        if (entity.getCloseReason()         != null) { update.set(r.closeReason,         entity.getCloseReason());         hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(r.updBy,               entity.getUpdBy());               hasAny = true; }
        if (entity.getUpdDate()             != null) { update.set(r.updDate,             entity.getUpdDate());             hasAny = true; }

        if (!hasAny) return 0;

        long affected = update.where(r.chattRoomId.eq(entity.getChattRoomId())).execute();
        return (int) affected;
    }
}
