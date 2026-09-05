package com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecBeBo.base.ec.st.data.entity.StRecon;

import java.util.List;
import java.util.Optional;

/** StRecon QueryDSL Custom Repository */
public interface QStReconRepository {

    Optional<StReconDto.Item> selectById(String id);

    List<StReconDto.Item> selectList(StReconDto.Request search);

    BasePage<StReconDto.Item> selectPageData(StReconDto.Request search);

    int updateSelective(StRecon entity);
}
