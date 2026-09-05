package com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleItem;

import java.util.List;
import java.util.Optional;

/** StSettleItem QueryDSL Custom Repository */
public interface QStSettleItemRepository {

    Optional<StSettleItemDto.Item> selectById(String id);

    List<StSettleItemDto.Item> selectList(StSettleItemDto.Request search);

    BasePage<StSettleItemDto.Item> selectPageData(StSettleItemDto.Request search);

    int updateSelective(StSettleItem entity);
}
