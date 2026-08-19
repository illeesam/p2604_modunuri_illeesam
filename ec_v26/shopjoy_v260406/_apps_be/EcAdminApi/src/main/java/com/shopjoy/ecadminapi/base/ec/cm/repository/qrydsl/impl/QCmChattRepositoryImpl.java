package com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.DateTimePath;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChatt;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmChatt;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattRepository;
import lombok.RequiredArgsConstructor;

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
    private static final QCmChatt cmChatt = QCmChatt.cmChatt;    /*
     * baseSelColumnQuery — 코드성 필드 실제 코드값 (sy_code_grp CHATT_STATUS)
     * CHATT_STATUS  {WAITING: '대기', ACTIVE: '진행중', DONE: '완료'}
     */
    private JPAQuery<CmChattDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmChattDto.Item.class,
                        cmChatt.chattId,              // 채팅방ID (PK, YYMMDDhhmmss+rand4)
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
        CmChattDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmChatt.chattId.eq(chattId))
                .fetchOne();
        return Optional.ofNullable(dtl);
    }

    @Override
    public List<CmChattDto.Item> selectList(CmChattDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmChatt.chattId, search.getChattId()));
        whereList.add(QdslUtil.strEq(cmChatt.chattStatusCd, search.getChattStatusCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmChatt.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmChatt.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<CmChattDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(wheres)
                .orderBy(orders);
        Integer pageNo = search.getPageNo();
        Integer pageSize = search.getPageSize();
        if (pageSize != null && pageSize > 0 && pageNo != null && pageNo > 0) {
            query.offset((long) (pageNo - 1) * pageSize).limit(pageSize);
        }
        List<CmChattDto.Item> list = query.fetch();
        return list;
    }

    @Override
    public BasePage<CmChattDto.Item> selectPageData(CmChattDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(cmChatt.chattId, search.getChattId()));
        whereList.add(QdslUtil.strEq(cmChatt.chattStatusCd, search.getChattStatusCd()));
        whereList.add("upd_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmChatt.updDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add("reg_date".equals(search.getDateRangeType()) ? QdslUtil.dateBetween(cmChatt.regDate, search.getDateRangeStart(), search.getDateRangeEnd()) : null);
        whereList.add(andSearchValue(search));
        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);

        JPAQuery<CmChattDto.Item> base = baseSelColumnQuery();

        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<CmChattDto.Item> pageList = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset((long) (pageNo - 1) * pageSize).limit(pageSize)
                .fetch();

        Long pageTotalCount = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmChatt.count())
                .where(wheres)
                .fetchOne();

        BasePage<CmChattDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    private BooleanExpression andSearchValue(CmChattDto.Request s) {
        if (s == null) return null;
        return QdslUtil.searchValueFields(s.getSearchValue(), s.getSearchType(), List.of(
            QdslUtil.FieldDef.like("chattId", cmChatt.chattId),
            QdslUtil.FieldDef.like("subject", cmChatt.subject),
            QdslUtil.FieldDef.like("chattMemo", cmChatt.chattMemo),
            QdslUtil.FieldDef.like("closeReason", cmChatt.closeReason)
        ));
    }

    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("chattId", cmChatt.chattId,
                   "regDate", cmChatt.regDate),
            new OrderSpecifier<>(Order.DESC, cmChatt.regDate),
            new OrderSpecifier<>(Order.ASC,  cmChatt.chattId));
    }

    @Override
    public int updateSelective(CmChatt entity) {
        if (entity.getChattId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmChatt);
        boolean hasAny = false;

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
