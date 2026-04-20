package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveUsage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PmSaveUsageMapper {

    PmSaveUsageDto selectById(@Param("id") String id);

    List<PmSaveUsageDto> selectList(@Param("p") Map<String, Object> p);

    List<PmSaveUsageDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PmSaveUsage entity);
}
