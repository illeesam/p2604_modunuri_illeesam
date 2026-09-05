package com.shopjoy.ecBeBo.base.zz.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.zz.data.dto.ZzExam2Dto;
import com.shopjoy.ecBeBo.base.zz.data.entity.ZzExam2;

import java.util.List;
import java.util.Optional;

/** ZzExam2 QueryDSL Custom Repository */
public interface QZzExam2Repository {

    /** 단건 조회 (복합 PK) */
    Optional<ZzExam2Dto.Item> selectById(String exam1Id, String exam2Id);

    /** 전체 목록 */
    List<ZzExam2Dto.Item> selectList(ZzExam2Dto.Request search);

    /** 페이지 목록 */
    BasePage<ZzExam2Dto.Item> selectPageData(ZzExam2Dto.Request search);

    int updateSelective(ZzExam2 entity);
}
