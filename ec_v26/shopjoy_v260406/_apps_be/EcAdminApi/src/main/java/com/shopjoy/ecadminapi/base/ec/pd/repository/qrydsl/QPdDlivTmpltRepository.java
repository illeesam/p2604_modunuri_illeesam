package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;

import java.util.List;
import java.util.Optional;

/** PdDlivTmplt QueryDSL Custom Repository */
public interface QPdDlivTmpltRepository {

    Optional<PdDlivTmpltDto.Item> selectById(String dlivTmpltId);

    List<PdDlivTmpltDto.Item> selectList(PdDlivTmpltDto.Request search);

    PdDlivTmpltDto.PageResponse selectPageList(PdDlivTmpltDto.Request search);

    int updateSelective(PdDlivTmplt entity);
}
