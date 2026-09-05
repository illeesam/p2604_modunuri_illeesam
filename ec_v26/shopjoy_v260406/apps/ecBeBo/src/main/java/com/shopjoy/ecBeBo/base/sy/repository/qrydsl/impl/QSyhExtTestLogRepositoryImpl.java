package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.jpa.JPAExpressions;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyhExtTestLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhExtTestLog;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyhExtTestLogRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

/** SyhExtTestLog(외부 연동 테스트 이력 — 개발용) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyhExtTestLogRepositoryImpl implements QSyhExtTestLogRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyhExtTestLogRepositoryImpl";
    private static final QSyhExtTestLog syhExtTestLog = QSyhExtTestLog.syhExtTestLog;

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
