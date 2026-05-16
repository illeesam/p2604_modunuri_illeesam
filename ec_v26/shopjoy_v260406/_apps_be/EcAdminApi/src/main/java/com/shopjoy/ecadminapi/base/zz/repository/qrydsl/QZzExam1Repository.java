package com.shopjoy.ecadminapi.base.zz.repository.qrydsl;

import com.shopjoy.ecadminapi.base.zz.data.dto.ZzExam1Dto;
import com.shopjoy.ecadminapi.base.zz.data.entity.ZzExam1;

import java.util.List;
import java.util.Optional;

/** ZzExam1 QueryDSL Custom Repository */
public interface QZzExam1Repository {

    /** 단건 조회 */
    Optional<ZzExam1Dto.Item> selectById(String exam1Id);

    /** 전체 목록 */
    List<ZzExam1Dto.Item> selectList(ZzExam1Dto.Request search);

    /** 페이지 목록 */
    ZzExam1Dto.PageResponse selectPageList(ZzExam1Dto.Request search);

    int updateSelective(ZzExam1 entity);
}
