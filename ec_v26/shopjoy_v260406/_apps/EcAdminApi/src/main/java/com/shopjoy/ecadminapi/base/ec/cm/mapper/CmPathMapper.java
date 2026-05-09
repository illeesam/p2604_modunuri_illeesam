package com.shopjoy.ecadminapi.base.ec.cm.mapper;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmPathDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmPath;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface CmPathMapper {

    CmPathDto.Item selectById(@Param("id") String id);

    List<CmPathDto.Item> selectList(CmPathDto.Request req);

    List<CmPathDto.Item> selectPageList(CmPathDto.Request req);

    long selectPageCount(CmPathDto.Request req);

    int updateSelective(CmPath entity);
}
