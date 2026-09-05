package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StDlivFeePolicyDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StDlivFeePolicy;

import java.util.List;
import java.util.Optional;

/** StDlivFeePolicy QueryDSL Custom Repository */
public interface QStDlivFeePolicyRepository {

    /** 단건 조회 */
    Optional<StDlivFeePolicyDto.Item> selectById(String id);

    /** 전체 목록 (page/size 가 양수면 페이징 적용) */
    List<StDlivFeePolicyDto.Item> selectList(StDlivFeePolicyDto.Request search);

    /** 페이지 목록 */
    BasePage<StDlivFeePolicyDto.Item> selectPageData(StDlivFeePolicyDto.Request search);

    int updateSelective(StDlivFeePolicy entity);
}
