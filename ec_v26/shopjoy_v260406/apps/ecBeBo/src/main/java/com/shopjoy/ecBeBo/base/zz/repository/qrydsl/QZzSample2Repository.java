package com.shopjoy.ecBeBo.base.zz.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.zz.data.dto.ZzSample2Dto;
import com.shopjoy.ecBeBo.base.zz.data.entity.ZzSample2;

import java.util.List;
import java.util.Optional;

/** ZzSample2 QueryDSL Custom Repository */
public interface QZzSample2Repository {

    /** 단건 조회 */
    Optional<ZzSample2Dto.Item> selectById(String id);

    /** 전체 목록 */
    List<ZzSample2Dto.Item> selectList(ZzSample2Dto.Request search);

    /** 페이지 목록 */
    BasePage<ZzSample2Dto.Item> selectPageData(ZzSample2Dto.Request search);

    int updateSelective(ZzSample2 entity);
}
