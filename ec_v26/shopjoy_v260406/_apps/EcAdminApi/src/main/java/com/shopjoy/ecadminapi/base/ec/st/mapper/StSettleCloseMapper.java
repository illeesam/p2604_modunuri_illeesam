package com.shopjoy.ecadminapi.base.ec.st.mapper;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface StSettleCloseMapper {

    StSettleCloseDto selectById(@Param("id") String id);

    List<StSettleCloseDto> selectList(@Param("p") Map<String, Object> p);

    List<StSettleCloseDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(StSettleClose entity);
}
