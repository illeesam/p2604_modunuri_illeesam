package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface MbhMemberTokenLogMapper {

    MbhMemberTokenLogDto selectById(@Param("id") String id);

    List<MbhMemberTokenLogDto> selectList(@Param("p") Map<String, Object> p);

    List<MbhMemberTokenLogDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(MbhMemberTokenLog entity);
}
