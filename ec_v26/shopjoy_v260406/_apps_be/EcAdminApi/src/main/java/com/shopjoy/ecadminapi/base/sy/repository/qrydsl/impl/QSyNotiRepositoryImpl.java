package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.data.BasePage;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.Projections;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.querydsl.jpa.impl.JPAUpdateClause;
import com.querydsl.core.types.dsl.Expressions;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyNotiDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyNoti;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNoti;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyNotiRepository;
import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import com.shopjoy.ecadminapi.common.util.QdslUtil;

/** SyNoti(알림함 (수신자별 알림 1건 = 1행)) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyNotiRepositoryImpl implements QSyNotiRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyNotiRepositoryImpl";
    private static final QSyNoti syNoti = QSyNoti.syNoti;

    /*
     * baseSelColumnQuery — 코드성 필드 예시 코드값
     * RECV_TYPE_CD {MEMBER: '쇼핑몰 회원', USER: '관리자 사용자'}
     * NOTI_TYPE_CD {NOTICE: '공지사항', ALARM: '수신알림', SPECIAL: '특이사항'}
     * CHANNEL_CD   {mail: '메일', sms: 'SMS', kakao: '알림톡', chat: '채팅', notice: '공지'}
     * READ_YN      {Y: '읽음', N: '안읽음'}
     */
    private JPAQuery<SyNotiDto.Item> baseSelColumnQuery() {
        return queryFactory
                .select(Projections.bean(SyNotiDto.Item.class,
                        syNoti.notiId,       // 알림ID (YYMMDDhhmmss+rand4)
                        syNoti.recvTypeCd,   // 수신자유형 — RECV_TYPE_CD {MEMBER, USER}
                        syNoti.recvId,       // 수신자ID
                        syNoti.recvNm,       // 수신자명 (발송 시점 스냅샷)
                        syNoti.notiTypeCd,   // 알림유형 — NOTI_TYPE_CD {NOTICE, ALARM, SPECIAL}
                        syNoti.channelCd,    // 발송채널 — CHANNEL_CD {mail, sms, kakao, chat, notice}
                        syNoti.notiTitle,    // 알림 제목
                        syNoti.notiContent,  // 알림 내용
                        syNoti.linkPage,     // 클릭 시 이동할 화면 pageId
                        syNoti.refId,        // 참조ID
                        syNoti.readYn,       // 읽음여부 — READ_YN {Y, N}
                        syNoti.readDate,     // 읽은일시
                        syNoti.regBy,        // 등록자
                        syNoti.regDate,      // 등록일시
                        syNoti.regSiteId,    // 등록사이트ID
                        syNoti.updBy,        // 수정자
                        syNoti.updDate       // 수정일시
                ))
                .from(syNoti);
    }

    /* 알림함 키조회 */
    @Override
    public Optional<SyNotiDto.Item> selectById(String notiId) {
        SyNotiDto.Item dtl = baseSelColumnQuery()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectById()")
                .where(syNoti.notiId.eq(notiId)).fetchOne();
        return Optional.ofNullable(dtl);
    }

    /* 알림함 목록조회 */
    @Override
    public List<SyNotiDto.Item> selectList(SyNotiDto.Request search) {
        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syNoti.notiId, search.getNotiId()));
        whereList.add(QdslUtil.strEq(syNoti.recvTypeCd, search.getRecvTypeCd()));
        whereList.add(QdslUtil.strEq(syNoti.recvId, search.getRecvId()));
        whereList.add(QdslUtil.strEq(syNoti.notiTypeCd, search.getNotiTypeCd()));
        whereList.add(QdslUtil.strEq(syNoti.channelCd, search.getChannelCd()));
        whereList.add(QdslUtil.strEq(syNoti.readYn, search.getReadYn()));
        whereList.add(QdslUtil.strEq(syNoti.regSiteId, search.getSiteId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        JPAQuery<SyNotiDto.Item> query = baseSelColumnQuery()
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
        List<SyNotiDto.Item> list = query.fetch();
        return list;
    }

    /* 알림함 페이지조회 */
    @Override
    public BasePage<SyNotiDto.Item> selectPageData(SyNotiDto.Request search) {
        int pageNo   = CmUtil.nvlInt(search.getPageNo(), 1);
        int pageSize = CmUtil.nvlInt(search.getPageSize(), 10);
        int offset   = (pageNo - 1) * pageSize;
        int limit    = pageSize;

        List<OrderSpecifier<?>> orderList = buildOrder(QdslUtil.sortOf(search));
        List<BooleanExpression> whereList = new ArrayList<>();
        whereList.add(QdslUtil.strEq(syNoti.notiId, search.getNotiId()));
        whereList.add(QdslUtil.strEq(syNoti.recvTypeCd, search.getRecvTypeCd()));
        whereList.add(QdslUtil.strEq(syNoti.recvId, search.getRecvId()));
        whereList.add(QdslUtil.strEq(syNoti.notiTypeCd, search.getNotiTypeCd()));
        whereList.add(QdslUtil.strEq(syNoti.channelCd, search.getChannelCd()));
        whereList.add(QdslUtil.strEq(syNoti.readYn, search.getReadYn()));
        whereList.add(QdslUtil.strEq(syNoti.regSiteId, search.getSiteId()));
        whereList.add(andSearchValue(search.getSearchValue(), search.getSearchType()));

        JPAQuery<SyNotiDto.Item> query = baseSelColumnQuery();

        BooleanExpression[] wheres = whereList.toArray(BooleanExpression[]::new);
        OrderSpecifier<?>[] orders = orderList.toArray(OrderSpecifier[]::new);
        List<SyNotiDto.Item> pageList = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: list")
                .where(wheres)
                .orderBy(orders)
                .offset(offset).limit(limit)
                .fetch();

        Long pageTotalCount = query.clone()
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectPageData() :: cnt")
                .select(syNoti.count())
                .where(wheres)
                .fetchOne();

        BasePage<SyNotiDto.Item> res = new BasePage<>();
        return res.setPageInfo(pageList, CmUtil.nvlLong(pageTotalCount), pageNo, pageSize, search);
    }

    /* 안읽음 건수 — 종 아이콘 뱃지용 */
    @Override
    public long countUnread(String recvTypeCd, String recvId) {
        Long cnt = queryFactory.select(syNoti.count()).from(syNoti)
                .setHint("org.hibernate.comment", QRY_SRC + " :: countUnread()")
                .where(syNoti.recvTypeCd.eq(recvTypeCd), syNoti.recvId.eq(recvId),
                       syNoti.readYn.ne("Y").or(syNoti.readYn.isNull()))
                .fetchOne();
        return CmUtil.nvlLong(cnt);
    }

    /* 모두읽음 — 수신자의 안읽은 알림 일괄 읽음 처리 */
    @Override
    public int markAllRead(String recvTypeCd, String recvId) {
        long affected = queryFactory.update(syNoti)
                .set(syNoti.readYn, "Y")
                .set(syNoti.readDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"))
                .set(syNoti.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"))
                .where(syNoti.recvTypeCd.eq(recvTypeCd), syNoti.recvId.eq(recvId),
                       syNoti.readYn.ne("Y").or(syNoti.readYn.isNull()))
                .execute();
        return (int) affected;
    }

    /* 전체삭제 — 수신자 본인 알림 전부 제거 */
    @Override
    public int deleteAllOf(String recvTypeCd, String recvId) {
        long affected = queryFactory.delete(syNoti)
                .where(syNoti.recvTypeCd.eq(recvTypeCd), syNoti.recvId.eq(recvId))
                .execute();
        return (int) affected;
    }

    /* searchType 사용 예  searchType = "fieldA,fieldB" */
    private BooleanExpression andSearchValue(String searchValue, String searchType) {
        return QdslUtil.searchValueFields(searchValue, searchType, List.of(
            QdslUtil.FieldDef.like("channelCd", syNoti.channelCd),
            QdslUtil.FieldDef.like("notiContent", syNoti.notiContent),
            QdslUtil.FieldDef.like("notiId", syNoti.notiId),
            QdslUtil.FieldDef.like("notiTitle", syNoti.notiTitle),
            QdslUtil.FieldDef.like("notiTypeCd", syNoti.notiTypeCd),
            QdslUtil.FieldDef.like("recvId", syNoti.recvId),
            QdslUtil.FieldDef.like("recvNm", syNoti.recvNm)
        ));
    }

    /**
     * 정렬조건 빌드
     * 예: "regDate desc, notiId asc"
     */
    private List<OrderSpecifier<?>> buildOrder(String sort) {
        return QdslUtil.buildOrder(sort,
            Map.of("notiId", syNoti.notiId,
                   "notiTitle", syNoti.notiTitle,
                   "readYn", syNoti.readYn,
                   "regDate", syNoti.regDate),
        new OrderSpecifier<>(Order.DESC, syNoti.regDate),
        new OrderSpecifier<>(Order.DESC, syNoti.notiId));
    }

    /* 알림함 수정 */
    @Override
    public int updateSelective(SyNoti entity) {
        if (entity.getNotiId() == null) return 0;

        JPAUpdateClause update = queryFactory.update(syNoti);
        boolean hasAny = false;

        if (entity.getRecvTypeCd()  != null) { update.set(syNoti.recvTypeCd,  entity.getRecvTypeCd());  hasAny = true; }
        if (entity.getRecvId()      != null) { update.set(syNoti.recvId,      entity.getRecvId());      hasAny = true; }
        if (entity.getRecvNm()      != null) { update.set(syNoti.recvNm,      entity.getRecvNm());      hasAny = true; }
        if (entity.getNotiTypeCd()  != null) { update.set(syNoti.notiTypeCd,  entity.getNotiTypeCd());  hasAny = true; }
        if (entity.getChannelCd()   != null) { update.set(syNoti.channelCd,   entity.getChannelCd());   hasAny = true; }
        if (entity.getNotiTitle()   != null) { update.set(syNoti.notiTitle,   entity.getNotiTitle());   hasAny = true; }
        if (entity.getNotiContent() != null) { update.set(syNoti.notiContent, entity.getNotiContent()); hasAny = true; }
        if (entity.getLinkPage()    != null) { update.set(syNoti.linkPage,    entity.getLinkPage());    hasAny = true; }
        if (entity.getRefId()       != null) { update.set(syNoti.refId,       entity.getRefId());       hasAny = true; }
        if (entity.getReadYn()      != null) { update.set(syNoti.readYn,      entity.getReadYn());      hasAny = true; }
        if (entity.getReadDate()    != null) { update.set(syNoti.readDate,    entity.getReadDate());    hasAny = true; }
        if (entity.getUpdBy()       != null) { update.set(syNoti.updBy,       entity.getUpdBy());       hasAny = true; }
        update.set(syNoti.updDate, Expressions.dateTimeTemplate(LocalDateTime.class, "CURRENT_TIMESTAMP"));

        if (!hasAny) return 0;

        long affected = update.where(syNoti.notiId.eq(entity.getNotiId())).execute();
        return (int) affected;
    }
}
