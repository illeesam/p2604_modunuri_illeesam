package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmDiscntUsageDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmDiscntUsageMapper {

    PmDiscntUsageDto.Item selectById(@Param("id") String id);

    List<PmDiscntUsageDto.Item> selectList(PmDiscntUsageDto.Request req);

    List<PmDiscntUsageDto.Item> selectPageList(PmDiscntUsageDto.Request req);

    long selectPageCount(PmDiscntUsageDto.Request req);

    int updateSelective(PmDiscntUsage entity);
}
