package com.shopjoy.ecadminapi.base.sy.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.base.sy.data.entity.QSyUserPref;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserPref;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QSyUserPrefRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

/** SyUserPref(관리자 사용자 개인화 설정) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QSyUserPrefRepositoryImpl implements QSyUserPrefRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "base.sy.repository.qrydsl.impl.QSyUserPrefRepositoryImpl";
    private static final QSyUserPref syUserPref = QSyUserPref.syUserPref;

    @Override
    public List<SyUserPref> selectAll(String userId) {
        return queryFactory
                .selectFrom(syUserPref)
                .where(syUserPref.userId.eq(userId))
                .orderBy(syUserPref.prefKey.asc())
                .fetch();
    }

    @Override
    public Optional<SyUserPref> selectByUserIdAndPrefKey(String userId, String prefKey) {
        SyUserPref result = queryFactory
                .selectFrom(syUserPref)
                .where(syUserPref.userId.eq(userId).and(syUserPref.prefKey.eq(prefKey)))
                .fetchOne();
        return Optional.ofNullable(result);
    }
}
