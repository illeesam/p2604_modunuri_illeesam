package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyhSendMsgLogMapper {

    SyhSendMsgLogDto selectById(@Param("id") String id);

    List<SyhSendMsgLogDto> selectList(@Param("p") Map<String, Object> p);

    List<SyhSendMsgLogDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyhSendMsgLog entity);
}
