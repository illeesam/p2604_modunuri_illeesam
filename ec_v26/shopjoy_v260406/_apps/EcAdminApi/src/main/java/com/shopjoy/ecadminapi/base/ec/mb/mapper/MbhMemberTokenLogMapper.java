package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface MbhMemberTokenLogMapper {

    MbhMemberTokenLogDto.Item selectById(@Param("id") String id);

    List<MbhMemberTokenLogDto.Item> selectList(MbhMemberTokenLogDto.Request req);

    List<MbhMemberTokenLogDto.Item> selectPageList(MbhMemberTokenLogDto.Request req);

    long selectPageCount(MbhMemberTokenLogDto.Request req);

    int updateSelective(MbhMemberTokenLog entity);
}
