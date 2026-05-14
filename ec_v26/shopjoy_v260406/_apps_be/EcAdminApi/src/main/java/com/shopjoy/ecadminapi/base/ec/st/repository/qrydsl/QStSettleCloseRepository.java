package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;

import java.util.List;
import java.util.Optional;

/** StSettleClose QueryDSL Custom Repository */
public interface QStSettleCloseRepository {

    Optional<StSettleCloseDto.Item> selectById(String id);

    List<StSettleCloseDto.Item> selectList(StSettleCloseDto.Request search);

    StSettleCloseDto.PageResponse selectPageList(StSettleCloseDto.Request search);

    int updateSelective(StSettleClose entity);
}
