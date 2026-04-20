package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberLoginHistDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginHist;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface MbhMemberLoginHistMapper {

    MbhMemberLoginHistDto selectById(@Param("id") String id);

    List<MbhMemberLoginHistDto> selectList(@Param("p") Map<String, Object> p);

    List<MbhMemberLoginHistDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(MbhMemberLoginHist entity);
}
