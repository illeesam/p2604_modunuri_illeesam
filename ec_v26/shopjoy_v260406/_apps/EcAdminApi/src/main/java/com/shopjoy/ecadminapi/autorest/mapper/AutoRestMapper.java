package com.shopjoy.ecadminapi.autorest.mapper;

import com.shopjoy.ecadminapi.autorest.data.dto.QueryParam;
import com.shopjoy.ecadminapi.autorest.data.dto.RowMap;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AutoRestMapper {

    List<RowMap> selectList(@Param("p") QueryParam p);

    List<RowMap> selectPage(@Param("p") QueryParam p);

    long selectCount(@Param("p") QueryParam p);

    RowMap selectById(@Param("p") QueryParam p);

    List<RowMap> selectChildren(@Param("p") QueryParam p);

    List<RowMap> selectCodeLabels(@Param("codeGrp") String codeGrp,
                                  @Param("siteId") String siteId);
}
