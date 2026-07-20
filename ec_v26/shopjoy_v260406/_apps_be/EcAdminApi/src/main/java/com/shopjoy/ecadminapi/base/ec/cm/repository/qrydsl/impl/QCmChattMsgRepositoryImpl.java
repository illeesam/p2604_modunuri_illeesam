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
import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.QCmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.repository.qrydsl.QCmChattMsgRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** CmChattMsg QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QCmChattMsgRepositoryImpl implements QCmChattMsgRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.ec.cm.repository.qrydsl.impl.QCmChattMsgRepositoryImpl";
    private static final QCmChattMsg cmChattMsg = QCmChattMsg.cmChattMsg;
    private static final Map<String, DateTimePath<LocalDateTime>> DATE_FIELDS = Map.of(
        "send_date", cmChattMsg.sendDate,
        "reg_date", cmChattMsg.regDate,
        "upd_date", cmChattMsg.updDate
    );
    private static final Map<String, StringPath> SEARCH_FIELDS = Map.ofEntries(
        Map.entry("chattId", cmChattMsg.chattId),
        Map.entry("senderNm", cmChattMsg.senderNm),
        Map.entry("msgText", cmChattMsg.msgText),
        Map.entry("refId", cmChattMsg.refId),
        Map.entry("refType", cmChattMsg.refType)
    );

    /*
     * baseSelColumnQuery — 코드성 필드 실제 코드값 (DDL 컬럼 코멘트 기준, sy_code 미등록)
     * SENDER_TYPE_CD  {MEMBER: '고객회원', ADMIN: '관리자', SYSTEM: '시스템'}
     * MSG_TYPE_CD     {TEXT: '텍스트', IMAGE: '이미지', FILE: '파일', REF: '참조', SYSTEM: '시스템'}
     * READ_YN         {Y: '읽음', N: '안읽음'}
     */
    private JPAQuery<CmChattMsgDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(CmChattMsgDto.Item.class,
                        cmChattMsg.chattMsgId,    // 메시지ID (PK, YYMMDDhhmmss+rand4)
                        cmChattMsg.siteId,        // 사이트ID (sy_site.site_id)
                        cmChattMsg.chattId,       // 채팅방ID (cm_chatt.chatt_id)
                        cmChattMsg.senderTypeCd,  // 발신자유형 — SENDER_TYPE_CD {MEMBER: '고객회원', ADMIN: '관리자', SYSTEM: '시스템'}
                        cmChattMsg.senderId,      // 발신자ID (memberId 또는 userId)
                        cmChattMsg.senderNm,      // 발신자명 (비정규화 캐시)
                        cmChattMsg.msgText,       // 메시지 내용
                        cmChattMsg.msgTypeCd,     // 메시지유형 — MSG_TYPE_CD {TEXT: '텍스트', IMAGE: '이미지', FILE: '파일', REF: '참조', SYSTEM: '시스템'}
                        cmChattMsg.attachGrpId,   // 첨부그룹ID (sy_attach_grp.attach_grp_id)
                        cmChattMsg.refType,       // 참조유형 — REF_TYPE {ORDER: '주문', PRODUCT: '상품', CLAIM: '클레임'}
                        cmChattMsg.refId,         // 참조ID
                        cmChattMsg.readYn,        // 읽음여부 — READ_YN {Y: '읽음', N: '안읽음'}
                        cmChattMsg.sendDate,      // 발송일시
                        cmChattMsg.regBy,         // 등록자
                        cmChattMsg.regDate,       // 등록일시
                        cmChattMsg.updBy,         // 수정자
                        cmChattMsg.updDate        // 수정일시
                ))
                .from(cmChattMsg);
    }

    @Override
    public Optional<CmChattMsgDto.Item> selectById(String chattMsgId) {
        CmChattMsgDto.Item dto = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(cmChattMsg.chattMsgId.eq(chattMsgId))
                .fetchOne();
        return Optional.ofNullable(dto);
    }

    @Override
    public List<CmChattMsgDto.Item> selectList(CmChattMsgDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(search);
        JPAQuery<CmChattMsgDto.Item> query = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectList()")
                .where(
                        QdslUtil.strEq(cmChattMsg.siteId, search.getSiteId()),
                        QdslUtil.strEq(cmChattMsg.chattMsgId, search.getChattMsgId()),
                        QdslUtil.strEq(cmChattMsg.chattId, search.getChattId()),
                        QdslUtil.strEq(cmChattMsg.senderId, search.getSenderId()),
                        QdslUtil.strGt(cmChattMsg.chattMsgId, search.getAfterMsgId()),
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
    public CmChattMsgDto.PageResponse selectPageData(CmChattMsgDto.Request search) {
        int pageNo   = search.getPageNo()   != null && search.getPageNo()   > 0 ? search.getPageNo()   : 1;
        int pageSize = search.getPageSize() != null && search.getPageSize() > 0 ? search.getPageSize() : 10;

        List<OrderSpecifier<?>> orderList = buildOrder(search);
        BooleanExpression[] wheres = {
                QdslUtil.strEq(cmChattMsg.siteId, search.getSiteId()),
                QdslUtil.strEq(cmChattMsg.chattMsgId, search.getChattMsgId()),
                QdslUtil.strEq(cmChattMsg.chattId, search.getChattId()),
                QdslUtil.strEq(cmChattMsg.senderId, search.getSenderId()),
                QdslUtil.strGt(cmChattMsg.chattMsgId, search.getAfterMsgId()),
                QdslUtil.dateBetween(search.getDateType(), search.getDateStart(), search.getDateEnd(), DATE_FIELDS),
                andSearchValue(search)
        };

        JPAQuery<CmChattMsgDto.Item> base = baseSelColumnQuery();

        List<CmChattMsgDto.Item> content = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orderList.toArray(OrderSpecifier[]::new))
                .offset((long) (pageNo - 1) * pageSize).limit(pageSize)
                .fetch();

        Long total = base.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(cmChattMsg.count())
                .where(wheres)
                .fetchOne();

        CmChattMsgDto.PageResponse res = new CmChattMsgDto.PageResponse();
        return res.setPageInfo(content, total == null ? 0L : total, pageNo, pageSize, search);
    }

private BooleanExpression andSearchValue(CmChattMsgDto.Request s) {
        return s == null ? null : QdslUtil.searchValueLike(s.getSearchValue(), s.getSearchType(), SEARCH_FIELDS);
    }


    @SuppressWarnings({"rawtypes", "unchecked"})
    private List<OrderSpecifier<?>> buildOrder(CmChattMsgDto.Request s) {
        List<OrderSpecifier<?>> orders = new ArrayList<>();
        String sort = s == null ? null : s.getSort();
        if (!StringUtils.hasText(sort)) {
            orders.add(new OrderSpecifier(Order.ASC, cmChattMsg.sendDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmChattMsg.chattMsgId));
            return orders;
        }
        for (String part : sort.split(",")) {
            String[] fd = part.trim().split(" ");
            if (fd.length == 2) {
                Order ord = "desc".equalsIgnoreCase(fd[1]) ? Order.DESC : Order.ASC;
                if      ("sendDate".equals(fd[0]))  orders.add(new OrderSpecifier(ord, cmChattMsg.sendDate));
                else if ("regDate".equals(fd[0]))   orders.add(new OrderSpecifier(ord, cmChattMsg.regDate));
                else if ("chattMsgId".equals(fd[0]))orders.add(new OrderSpecifier(ord, cmChattMsg.chattMsgId));
            }
        }
        if (orders.isEmpty()) {
            orders.add(new OrderSpecifier<>(Order.ASC, cmChattMsg.sendDate));
            orders.add(new OrderSpecifier<>(Order.ASC, cmChattMsg.chattMsgId));
        }
        return orders;
    }

    @Override
    public int updateSelective(CmChattMsg entity) {
        if (entity.getChattMsgId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(cmChattMsg);
        boolean hasAny = false;

        if (entity.getSiteId()       != null) { update.set(cmChattMsg.siteId,       entity.getSiteId());       hasAny = true; }
        if (entity.getChattId()      != null) { update.set(cmChattMsg.chattId,       entity.getChattId());      hasAny = true; }
        if (entity.getSenderTypeCd() != null) { update.set(cmChattMsg.senderTypeCd, entity.getSenderTypeCd()); hasAny = true; }
        if (entity.getSenderId()     != null) { update.set(cmChattMsg.senderId,      entity.getSenderId());     hasAny = true; }
        if (entity.getSenderNm()     != null) { update.set(cmChattMsg.senderNm,      entity.getSenderNm());     hasAny = true; }
        if (entity.getMsgText()      != null) { update.set(cmChattMsg.msgText,        entity.getMsgText());      hasAny = true; }
        if (entity.getMsgTypeCd()    != null) { update.set(cmChattMsg.msgTypeCd,     entity.getMsgTypeCd());    hasAny = true; }
        if (entity.getAttachGrpId()  != null) { update.set(cmChattMsg.attachGrpId,   entity.getAttachGrpId());  hasAny = true; }
        if (entity.getRefType()      != null) { update.set(cmChattMsg.refType,        entity.getRefType());      hasAny = true; }
        if (entity.getRefId()        != null) { update.set(cmChattMsg.refId,          entity.getRefId());        hasAny = true; }
        if (entity.getReadYn()       != null) { update.set(cmChattMsg.readYn,         entity.getReadYn());       hasAny = true; }
        if (entity.getSendDate()     != null) { update.set(cmChattMsg.sendDate,       entity.getSendDate());     hasAny = true; }
        if (entity.getUpdBy()        != null) { update.set(cmChattMsg.updBy,          entity.getUpdBy());        hasAny = true; }
        update.set(cmChattMsg.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(cmChattMsg.chattMsgId.eq(entity.getChattMsgId())).execute();
        return (int) affected;
    }
}
