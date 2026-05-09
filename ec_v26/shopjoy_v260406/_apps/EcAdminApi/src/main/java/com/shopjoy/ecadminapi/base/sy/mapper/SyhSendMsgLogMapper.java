package com.shopjoy.ecadminapi.base.sy.mapper;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhSendMsgLogDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhSendMsgLog;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;

@Mapper
public interface SyhSendMsgLogMapper {

    /** 단건조회 */
    SyhSendMsgLogDto.Item selectById(@Param("id") String id);

    /** 목록조회 */
    List<SyhSendMsgLogDto.Item> selectList(Map<String, Object> p);

    /** 페이징조회 */
    List<SyhSendMsgLogDto.Item> selectPageList(Map<String, Object> p);

    /** 페이징조회 - 전체건수 */
    long selectPageCount(Map<String, Object> p);

    /** 수정 */
    int updateSelective(SyhSendMsgLog entity);
}
