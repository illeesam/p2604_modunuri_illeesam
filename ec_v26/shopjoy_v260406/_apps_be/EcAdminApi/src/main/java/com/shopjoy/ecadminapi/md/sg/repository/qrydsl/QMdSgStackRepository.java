package com.shopjoy.ecadminapi.md.sg.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.md.sg.data.dto.MdSgStackDto;
import com.shopjoy.ecadminapi.md.sg.data.entity.MdSgStack;

import java.util.List;
import java.util.Optional;

/** MdSgStack QueryDSL Custom Repository */
public interface QMdSgStackRepository {

    Optional<MdSgStackDto.Item> selectById(String stackId);

    List<MdSgStackDto.Item> selectList(MdSgStackDto.Request search);

    BasePage<MdSgStackDto.Item> selectPageData(MdSgStackDto.Request search);

    int updateSelective(MdSgStack entity);
}
