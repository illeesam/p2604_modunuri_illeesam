package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmSaveMapper {

    PmSaveDto.Item selectById(@Param("id") String id);

    List<PmSaveDto.Item> selectList(PmSaveDto.Request req);

    List<PmSaveDto.Item> selectPageList(PmSaveDto.Request req);

    long selectPageCount(PmSaveDto.Request req);

    int updateSelective(PmSave entity);
}
