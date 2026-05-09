package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PdDlivTmpltMapper {

    PdDlivTmpltDto.Item selectById(@Param("id") String id);

    List<PdDlivTmpltDto.Item> selectList(PdDlivTmpltDto.Request req);

    List<PdDlivTmpltDto.Item> selectPageList(PdDlivTmpltDto.Request req);

    long selectPageCount(PdDlivTmpltDto.Request req);

    int updateSelective(PdDlivTmplt entity);
}
