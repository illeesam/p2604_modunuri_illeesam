package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface MbhMemberLoginLogMapper {

    MbhMemberLoginLogDto.Item selectById(@Param("id") String id);

    List<MbhMemberLoginLogDto.Item> selectList(MbhMemberLoginLogDto.Request req);

    List<MbhMemberLoginLogDto.Item> selectPageList(MbhMemberLoginLogDto.Request req);

    long selectPageCount(MbhMemberLoginLogDto.Request req);

    int updateSelective(MbhMemberLoginLog entity);
}
