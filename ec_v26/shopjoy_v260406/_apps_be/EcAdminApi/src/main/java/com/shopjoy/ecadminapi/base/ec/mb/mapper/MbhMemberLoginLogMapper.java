package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import org.apache.ibatis.annotations.Mapper;
import java.util.Map;
import org.apache.ibatis.annotations.Param;
import java.util.Map;

import java.util.List;
@Mapper
public interface MbhMemberLoginLogMapper {

    MbhMemberLoginLogDto.Item selectById(@Param("id") String id);

    List<MbhMemberLoginLogDto.Item> selectList(Map<String, Object> p);

    List<MbhMemberLoginLogDto.Item> selectPageList(Map<String, Object> p);

    long selectPageCount(Map<String, Object> p);

    int updateSelective(MbhMemberLoginLog entity);
}
