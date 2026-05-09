package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyAlarmMapper {

    /** 단건조회 */
    SyAlarmDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyAlarmDto.Item> selectList(SyAlarmDto.Request req);

    /** 페이징조회 */
    List<SyAlarmDto.Item> selectPageList(SyAlarmDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyAlarmDto.Request req);

    /** 수정 */
    int updateSelective(SyAlarm entity);
}
