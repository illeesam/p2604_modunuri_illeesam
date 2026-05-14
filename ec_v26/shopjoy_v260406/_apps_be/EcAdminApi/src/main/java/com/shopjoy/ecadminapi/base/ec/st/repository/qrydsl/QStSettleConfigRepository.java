package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleConfigDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;

import java.util.List;
import java.util.Optional;

/** StSettleConfig QueryDSL Custom Repository */
public interface QStSettleConfigRepository {

    /** 단건 조회 */
    Optional<StSettleConfigDto.Item> selectById(String id);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<StSettleConfigDto.Item> selectList(StSettleConfigDto.Request search);

    /** 페이지 목록 */
    StSettleConfigDto.PageResponse selectPageList(StSettleConfigDto.Request search);

    int updateSelective(StSettleConfig entity);
}
