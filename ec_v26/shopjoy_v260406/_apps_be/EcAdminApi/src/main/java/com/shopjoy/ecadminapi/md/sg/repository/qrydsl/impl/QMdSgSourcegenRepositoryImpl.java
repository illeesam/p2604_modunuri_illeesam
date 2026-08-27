package com.shopjoy.ecadminapi.md.sg.repository.qrydsl.impl;

import com.querydsl.jpa.impl.JPAQueryFactory;
import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgSourcegen;
import com.shopjoy.ecadminapi.md.sg.data.entity.QMdSgSourcegen;
import com.shopjoy.ecadminapi.md.sg.repository.qrydsl.QMdSgSourcegenRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;

/** MdSgSourcegen(프로젝트 DDL 탭) QueryDSL Custom 구현체 */
@RequiredArgsConstructor
public class QMdSgSourcegenRepositoryImpl implements QMdSgSourcegenRepository {

    private final JPAQueryFactory queryFactory;
    private static final String QRY_SRC = "md.sg.repository.qrydsl.impl.QMdSgSourcegenRepositoryImpl";
    private static final QMdSgSourcegen mdSgSourcegen = QMdSgSourcegen.mdSgSourcegen;

    @Override
    public List<MdSgSourcegen> selectListByProjectId(String projectId) {
        return queryFactory.selectFrom(mdSgSourcegen)
                .setHint("org.hibernate.comment", QRY_SRC + " :: selectListByProjectId()")
                .where(mdSgSourcegen.projectId.eq(projectId))
                .orderBy(mdSgSourcegen.tabNo.asc())
                .fetch();
    }
}
