package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhExtTestLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhExtTestLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhExtTestLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.List;

/** SyhExtTestLog(외부 연동 테스트 이력 — 개발용) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhExtTestLogRepositoryImpl implements QSyhExtTestLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhExtTestLogRepositoryImpl";
    private static final QSyhExtTestLog syhExtTestLog = QSyhExtTestLog.syhExtTestLog;

    @Override
    public Page<SyhExtTestLog> selectByChannelKey(String channelKey, Pageable pageable) {
        return fetchPage(syhExtTestLog.channelKey.eq(channelKey), pageable, "selectByChannelKey");
    }

    @Override
    public Page<SyhExtTestLog> selectAllOrderByRegDateDesc(Pageable pageable) {
        return fetchPage(null, pageable, "selectAllOrderByRegDateDesc");
    }

    private Page<SyhExtTestLog> fetchPage(BooleanExpression where, Pageable pageable, String opName) {
        List<SyhExtTestLog> content = queryFactory.selectFrom(syhExtTestLog)
                .setHint("org.hibernate.comment", QRY_SRC + " :: " + opName + "() :: list")
                .where(where)
                .orderBy(syhExtTestLog.regDate.desc())
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();

        Long total = queryFactory.select(syhExtTestLog.count())
                .from(syhExtTestLog)
                .setHint("org.hibernate.comment", QRY_SRC + " :: " + opName + "() :: cnt")
                .where(where)
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    /** 채널별 최신 이력 1건씩 — 채널당 regDate 최대값 상관 서브쿼리 */
    @Override
    public List<SyhExtTestLog> selectLatestByChannel() {
        QSyhExtTestLog sub = new QSyhExtTestLog("sub");
        return queryFactory.selectFrom(syhExtTestLog)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectLatestByChannel()")
                .where(syhExtTestLog.regDate.eq(
                        JPAExpressions.select(sub.regDate.max())
                                .from(sub)
                                .where(sub.channelKey.eq(syhExtTestLog.channelKey))))
                .orderBy(syhExtTestLog.channelKey.asc())
                .fetch();
    }
}
