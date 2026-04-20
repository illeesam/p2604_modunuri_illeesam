package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface SyhAlarmSendHistMapper {

    SyhAlarmSendHistDto selectById(@Param("id") String id);

    List<SyhAlarmSendHistDto> selectList(@Param("p") Map<String, Object> p);

    List<SyhAlarmSendHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(SyhAlarmSendHist entity);
}
