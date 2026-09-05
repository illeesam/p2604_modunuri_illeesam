package com.shopjoy.ecBeBo.md.cb.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.md.cb.data.dto.MdCbSymbolDto;
import com.shopjoy.ecBeBo.md.cb.data.entity.MdCbSymbol;

import java.util.List;
import java.util.Optional;

/** MdCbSymbol QueryDSL Custom Repository */
public interface QMdCbSymbolRepository {

    Optional<MdCbSymbolDto.Item> selectById(String symbolId);

    List<MdCbSymbolDto.Item> selectList(MdCbSymbolDto.Request search);

    BasePage<MdCbSymbolDto.Item> selectPageData(MdCbSymbolDto.Request search);

    int updateSelective(MdCbSymbol entity);
}
