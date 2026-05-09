package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdBundleItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdProdBundleItemMapper {

    PdProdBundleItemDto.Item selectById(@Param("id") String id);

    List<PdProdBundleItemDto.Item> selectList(PdProdBundleItemDto.Request req);

    List<PdProdBundleItemDto.Item> selectPageList(PdProdBundleItemDto.Request req);

    long selectPageCount(PdProdBundleItemDto.Request req);

    int updateSelective(PdProdBundleItem entity);
}
