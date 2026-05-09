package com.shopjoy.ecadminapi.base.ec.mb.mapper;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberGroupDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface MbMemberGroupMapper {

    MbMemberGroupDto.Item selectById(@Param("id") String id);

    List<MbMemberGroupDto.Item> selectList(MbMemberGroupDto.Request req);

    List<MbMemberGroupDto.Item> selectPageList(MbMemberGroupDto.Request req);

    long selectPageCount(MbMemberGroupDto.Request req);

    int updateSelective(MbMemberGroup entity);
}
