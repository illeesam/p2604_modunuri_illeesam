package com.shopjoy.ecBeBo.md.cb.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.md.cb.data.dto.MdCbPatternDto;
import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbPattern;

import java.util.List;
import java.util.Optional;

/** MdCbPattern QueryDSL Custom Repository */
public interface QMdCbPatternRepository {

    Optional<MdCbPatternDto.Item> selectById(String patternId);

    List<MdCbPatternDto.Item> selectList(MdCbPatternDto.Request search);

    BasePage<MdCbPatternDto.Item> selectPageData(MdCbPatternDto.Request search);

    int updateSelective(MdCbPattern entity);
}
