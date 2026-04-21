package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PmSaveItemMapper {

    PmSaveItemDto selectById(@Param("id") String id);

    List<PmSaveItemDto> selectList(@Param("p") Map<String, Object> p);

    List<PmSaveItemDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PmSaveItem entity);
}
