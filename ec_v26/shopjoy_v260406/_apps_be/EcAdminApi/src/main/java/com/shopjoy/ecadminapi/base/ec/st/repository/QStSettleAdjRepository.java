package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;

import java.util.List;
import java.util.Optional;

/** StSettleAdj QueryDSL Custom Repository */
public interface QStSettleAdjRepository {

    /** 단건 조회 */
    Optional<StSettleAdjDto.Item> selectById(String id);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<StSettleAdjDto.Item> selectList(StSettleAdjDto.Request search);

    /** 페이지 목록 (pageNo/pageSize 미지정 시 1페이지/10건 기본) */
    StSettleAdjDto.PageResponse selectPageList(StSettleAdjDto.Request search);

    int updateSelective(StSettleAdj entity);
}
