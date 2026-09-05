package com.shopjoy.ecBeBo.autorest.mapper;

import com.shopjoy.ecBeBo.autorest.data.dto.QueryParam;
import com.shopjoy.ecBeBo.autorest.data.dto.RowMap;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AutoRestMapper {

    List<RowMap> selectList(QueryParam p);

    List<RowMap> selectPage(QueryParam p);

    long selectCount(QueryParam p);

    RowMap selectById(QueryParam p);

    List<RowMap> selectChildren(QueryParam p);

    List<RowMap> selectCodeLabels(@Param("codeGrp") String codeGrp,
                                  @Param("siteId") String siteId);
}
