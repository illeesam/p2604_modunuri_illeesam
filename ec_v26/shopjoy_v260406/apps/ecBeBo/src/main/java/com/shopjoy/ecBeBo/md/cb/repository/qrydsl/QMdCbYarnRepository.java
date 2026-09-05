package com.shopjoy.ecBeBo.md.cb.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.md.cb.data.dto.MdCbYarnDto;
import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbYarn;

import java.util.List;
import java.util.Optional;

/** MdCbYarn QueryDSL Custom Repository */
public interface QMdCbYarnRepository {

    Optional<MdCbYarnDto.Item> selectById(String yarnId);

    List<MdCbYarnDto.Item> selectList(MdCbYarnDto.Request search);

    BasePage<MdCbYarnDto.Item> selectPageData(MdCbYarnDto.Request search);

    int updateSelective(MdCbYarn entity);
}
