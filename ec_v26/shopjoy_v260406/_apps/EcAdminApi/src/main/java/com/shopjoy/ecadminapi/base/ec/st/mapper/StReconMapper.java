package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StReconDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface StReconMapper {

    StReconDto.Item selectById(@Param("id") String id);

    List<StReconDto.Item> selectList(StReconDto.Request req);

    List<StReconDto.Item> selectPageList(StReconDto.Request req);

    long selectPageCount(StReconDto.Request req);

    int updateSelective(StRecon entity);
}
