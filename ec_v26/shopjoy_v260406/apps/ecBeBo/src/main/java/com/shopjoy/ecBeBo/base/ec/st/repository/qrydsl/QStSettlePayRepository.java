package com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettlePay;

import java.util.List;
import java.util.Optional;

/** StSettlePay QueryDSL Custom Repository */
public interface QStSettlePayRepository {

    Optional<StSettlePayDto.Item> selectById(String id);

    List<StSettlePayDto.Item> selectList(StSettlePayDto.Request search);

    BasePage<StSettlePayDto.Item> selectPageData(StSettlePayDto.Request search);

    int updateSelective(StSettlePay entity);
}
