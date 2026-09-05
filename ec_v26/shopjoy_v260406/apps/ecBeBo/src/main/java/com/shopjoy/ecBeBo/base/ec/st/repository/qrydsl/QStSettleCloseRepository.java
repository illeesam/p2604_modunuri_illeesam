package com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleClose;

import java.util.List;
import java.util.Optional;

/** StSettleClose QueryDSL Custom Repository */
public interface QStSettleCloseRepository {

    Optional<StSettleCloseDto.Item> selectById(String id);

    List<StSettleCloseDto.Item> selectList(StSettleCloseDto.Request search);

    BasePage<StSettleCloseDto.Item> selectPageData(StSettleCloseDto.Request search);

    int updateSelective(StSettleClose entity);
}
