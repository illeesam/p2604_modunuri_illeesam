package com.shopjoy.ecadminapi.base.zz.repository.qrydsl;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam3Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam3;

import java.util.List;
import java.util.Optional;

/** ZzExam3 QueryDSL Custom Repository */
public interface QZzExam3Repository {

    /** 단건 조회 (복합 PK) */
    Optional<ZzExam3Dto.Item> selectById(String exam1Id, String exam2Id, String exam3Id);

    /** 전체 목록 */
    List<ZzExam3Dto.Item> selectList(ZzExam3Dto.Request search);

    /** 페이지 목록 */
    ZzExam3Dto.PageResponse selectPageList(ZzExam3Dto.Request search);

    int updateSelective(ZzExam3 entity);
}
