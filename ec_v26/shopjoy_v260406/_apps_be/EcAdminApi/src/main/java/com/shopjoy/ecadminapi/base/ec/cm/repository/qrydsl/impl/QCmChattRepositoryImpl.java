package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.StringPath;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChatt;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmChatt;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmChatt QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmChattRepositoryImpl implements QCmChattRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmChattRepositoryImpl";
    private static final QCmChatt cmChatt = QCmChatt.cmChatt;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "reg_date", cmChatt.regDate,
        "upd_date", cmChatt.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("chattId", cmChatt.chattId),
        Map.entry("subject", cmChatt.subject),
        Map.entry("chattMemo", cmChatt.chattMemo),
        Map.entry("closeReason", cmChatt.closeReason)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 실제 코드값 (sy_code_grp CHATT_STATUS)
     * CHATT_STATUS  {WAITING: '대기', ACTIVE: '진행중', DONE: '완료'}
     */
    private JPAQuery<CmChattDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmChattDto.Item.class,
                        cmChatt.chattId,              // 채팅방ID (PK, YYMMDDhhmmss+rand4)
                        cmChatt.siteId,               // 사이트ID (sy_site.site_id)
                        cmChatt.subject,              // 채팅주제
                        cmChatt.chattStatusCd,        // 상태 — CHATT_STATUS {WAITING: '대기', ACTIVE: '진행중', DONE: '완료'}
                        cmChatt.chattStatusCdBefore,  // 변경 전 상태 — CHATT_STATUS {WAITING: '대기', ACTIVE: '진행중', DONE: '완료'}
                        cmChatt.lastMsgDate,          // 마지막 메시지 일시
                        cmChatt.chattMemo,            // 관리자 메모
                        cmChatt.closeDate,            // 종료일시
                        cmChatt.closeReason,          // 종료사유
                        cmChatt.regBy,                // 등록자
                        cmChatt.regDate,              // 등록일시
                        cmChatt.updBy,                // 수정자
                        cmChatt.updDate               // 수정일시
                ))
                .from(cmChatt);
    }

    @Override
    public Optional<CmChattDto.Item> selectById(String chattId) {
        CmChattDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmChatt.chattId.eq(chattId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<CmChattDto.Item> selectList(CmChattDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmChattDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                        QdslUtil.strEq(cmChatt.siteId, search.getSiteId()),
                        QdslUtil.strEq(cmChatt.chattId, search.getChattId()),
                        QdslUtil.strEq(cmChatt.chattStatusCd, search.getChattStatusCd()),
                        QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                        andSearchValue(search)
                )
                .orderBy(orderList.toArray(OrderSpecifier[]::new));
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            query.offset((long) (pageNo - 1) * pageSize).limit(pageSize);
        }
        return query.fetch();
    }

    @Override
    public CmChattDto.PageResponse selectPageData(CmChattDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(cmChatt.siteId, search.getSiteId()),
                QdslUtil.strEq(cmChatt.chattId, search.getChattId()),
                QdslUtil.strEq(cmChatt.chattStatusCd, search.getChattStatusCd()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValue(search)
        };

        JPAQuery<CmChattDto.Item> base = baseSelColumnQuery();

        List<CmChattDto.Item> content = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset((long) (pageNo - 1) * pageSize).limit(pageSize)
                .fetch();

        Long total = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmChatt.count())
                .where(wheres)
                .fetchOne();

        CmChattDto.PageResponse res = new CmChattDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

private BooleanExpression andSearchValue(CmChattDto.Request s) {
        return s == null ? null : QdslUtil.searchValueLike(s.getSearchValue(), s.getSearchType(), SEARCH_FIELDS);
    }


    @SuppressWarnings({"rawtypes", "unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmChattDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.DESC, cmChatt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmChatt.chattId));
            return orders;
        }
        for (String part : sort.split(",")) {
            String[] fd = part.trim().split(" ");
            if (fd.length == 2) {
                Order ord = "desc".equalsIgnoreCase(fd[1]) ? Order.DESC : Order.ASC;
                if ("chattId".equals(fd[0]))  orders.add(new OrderSpecifier(ord, cmChatt.chattId));
                else if ("regDate".equals(fd[0])) orders.add(new OrderSpecifier(ord, cmChatt.regDate));
            }
        }
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.DESC, cmChatt.regDate));
            orders.add(new OrderSpecifier<>(Order.ASC,  cmChatt.chattId));
        }
        return orders;
    }

    @Override
    public int updateSelective(CmChatt entity) {
        if (entity.getChattId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmChatt);
        boolean hasAny = false;

        if (entity.getSiteId()              != null) { update.set(cmChatt.siteId,              entity.getSiteId());              hasAny = true; }
        if (entity.getSubject()             != null) { update.set(cmChatt.subject,             entity.getSubject());             hasAny = true; }
        if (entity.getChattStatusCd()       != null) { update.set(cmChatt.chattStatusCd,       entity.getChattStatusCd());       hasAny = true; }
        if (entity.getChattStatusCdBefore() != null) { update.set(cmChatt.chattStatusCdBefore, entity.getChattStatusCdBefore()); hasAny = true; }
        if (entity.getLastMsgDate()         != null) { update.set(cmChatt.lastMsgDate,         entity.getLastMsgDate());         hasAny = true; }
        if (entity.getChattMemo()           != null) { update.set(cmChatt.chattMemo,           entity.getChattMemo());           hasAny = true; }
        if (entity.getCloseDate()           != null) { update.set(cmChatt.closeDate,           entity.getCloseDate());           hasAny = true; }
        if (entity.getCloseReason()         != null) { update.set(cmChatt.closeReason,         entity.getCloseReason());         hasAny = true; }
        if (entity.getUpdBy()               != null) { update.set(cmChatt.updBy,               entity.getUpdBy());               hasAny = true; }
        update.set(cmChatt.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmChatt.chattId.eq(entity.getChattId())).execute();
        return (int) affected;
    }
}
