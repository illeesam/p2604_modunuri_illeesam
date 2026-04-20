package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbSnsMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbSnsMember;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface MbSnsMemberMapper {

    MbSnsMemberDto selectById(@Param("id") String id);

    List<MbSnsMemberDto> selectList(@Param("p") Map<String, Object> p);

    List<MbSnsMemberDto> selectPageList(@Param("p") Map<String, Object> p);

    long selectPageCount(@Param("p") Map<String, Object> p);

    int updateSelective(MbSnsMember entity);
}
