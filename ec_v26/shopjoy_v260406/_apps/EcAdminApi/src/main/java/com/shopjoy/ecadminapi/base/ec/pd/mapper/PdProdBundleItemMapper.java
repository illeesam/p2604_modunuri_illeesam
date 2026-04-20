package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdBundleItemDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdBundleItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PdProdBundleItemMapper {

    PdProdBundleItemDto selectById(@Param("id") String id);

    List<PdProdBundleItemDto> selectList(@Param("p") Map<String, Object> p);

    List<PdProdBundleItemDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PdProdBundleItem entity);
}
