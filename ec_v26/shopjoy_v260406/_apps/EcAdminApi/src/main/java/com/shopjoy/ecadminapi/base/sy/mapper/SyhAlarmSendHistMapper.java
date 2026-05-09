package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAlarmSendHistDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAlarmSendHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface SyhAlarmSendHistMapper {

    /** 단건조회 */
    SyhAlarmSendHistDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyhAlarmSendHistDto.Item> selectList(SyhAlarmSendHistDto.Request req);

    /** 페이징조회 */
    List<SyhAlarmSendHistDto.Item> selectPageList(SyhAlarmSendHistDto.Request req);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(SyhAlarmSendHistDto.Request req);

    /** 수정 */
    int updateSelective(SyhAlarmSendHist entity);
}
