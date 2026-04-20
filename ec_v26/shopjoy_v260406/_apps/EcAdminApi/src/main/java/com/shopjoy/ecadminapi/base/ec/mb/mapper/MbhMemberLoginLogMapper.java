package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface MbhMemberLoginLogMapper {

    MbhMemberLoginLogDto selectById(@Param("id") String id);

    List<MbhMemberLoginLogDto> selectList(@Param("p") Map<String, Object> p);

    List<MbhMemberLoginLogDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(MbhMemberLoginLog entity);
}
