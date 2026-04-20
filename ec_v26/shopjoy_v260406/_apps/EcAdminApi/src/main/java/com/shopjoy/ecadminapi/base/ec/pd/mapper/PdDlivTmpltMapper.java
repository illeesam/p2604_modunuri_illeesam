package com.shopjoy.ecadminapi.base.ec.pd.mapper;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdDlivTmpltDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdDlivTmplt;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface PdDlivTmpltMapper {

    PdDlivTmpltDto selectById(@Param("id") String id);

    List<PdDlivTmpltDto> selectList(@Param("p") Map<String, Object> p);

    List<PdDlivTmpltDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(PdDlivTmplt entity);
}
